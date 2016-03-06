/*
	ratingwindow.js
	Copyright © 2009, 2010  WOT Services Oy <info@mywot.com>

	This file is part of WOT.

	WOT is free software: you can redistribute it and/or modify it
	under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	WOT is distributed in the hope that it will be useful, but WITHOUT
	ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
	or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
	License for more details.

	You should have received a copy of the GNU General Public License
	along with WOT. If not, see <http://www.gnu.org/licenses/>.
*/

$.extend(wot, { ratingwindow: {
	sliderwidth: 194,

	/* rating state */

	state: {},

	updatestate: function(target, data)
	{
		/* initialize on target change */
		if (this.state.target != target) {
			this.finishstate();
			this.state = { target: target, down: -1 };
		}

		var state = {};

		/* add existing ratings to state */
		if (data && data.status == wot.cachestatus.ok) {
			wot.components.forEach(function(item) {
				if (data.value[item.name] && data.value[item.name].t >= 0) {
					state[item.name] = { t: data.value[item.name].t };
				}
			});
		}

		/* remember previous state */
		this.state = $.extend(state, this.state);
	},

	setstate: function(component, t)
	{
		if (t >= 0) {
			this.state[component] = { t: t };
		} else {
			delete(this.state[component]);
		}
	},

	finishstate: function()
	{
		wot.post("rating", "finishstate", { state: this.state });
	},

	/* helpers */

	navigate: function(url)
	{
		try {
			wot.post("rating", "navigate", { url: url });
			this.hide();
		} catch (e) {
			wot.log("ratingwindow.navigate: failed with " + e + "\n", true);
		}
	},

	getcached: function()
	{
		if (this.current.target && this.current.cached &&
				this.current.cached.status == wot.cachestatus.ok) {
			return this.current.cached;
		}

		return { value: {} };
	},

	getrating: function(e, stack)
	{
		try {
			if (this.getcached().status == wot.cachestatus.ok) {
				var slider = $(".wot-rating-slider", stack);

				/* rating from slider position */
				var position = 100 * (e.clientX - slider.position().left) /
									wot.ratingwindow.sliderwidth;

				/* sanitize the rating value */
				if (position < 0) {
					position = 0;
				} else if (position > 100) {
					position = 100;
				} else {
					position = position.toFixed();
				}

				return position;
			}
		} catch (e) {
			wot.log("ratingwindow.getrating: failed with " + e + "\n", true);
		}

		return -1;
	},

	/* user interface */

	current: {},

	updateratings: function(state)
	{
		/* indicator state */
		state = state || {};

		var cached = this.getcached();

		/* update each component */
		wot.components.forEach(function(item) {
			if (state.name != null && state.name != item.name) {
				return;
			}

			var elems = {};

			[	"stack",
				"slider",
				"indicator",
				"helptext",
				"helplink"
			].forEach(function(elem) {
				elems[elem] = $("#wot-rating-" + item.name + "-" + elem);
			});

			var t = -1;

			if (wot.ratingwindow.state[item.name] &&
					wot.ratingwindow.state[item.name].t != null) {
				t = wot.ratingwindow.state[item.name].t;
			}

			if (t >= 0) {
				/* rating */
				elems.indicator.css("left",
					(t * wot.ratingwindow.sliderwidth /
					 	100).toFixed() + "px");

				elems.stack.addClass("testimony").removeClass("hover");
			} else if (state.name != null && state.t >= 0) {
				/* temporary indicator position */
				elems.indicator.css("left",
					(state.t * wot.ratingwindow.sliderwidth /
					 	100).toFixed() + "px");

				elems.stack.removeClass("testimony").addClass("hover");
			} else {
				elems.stack.removeClass("testimony").removeClass("hover");
			}

			var helptext = "";

			if (t >= 0) {
				var r = cached.value[item.name] ?
							cached.value[item.name].r : -1;

				if (r >= 0 && Math.abs(r - t) > 35) {
					helptext = wot.i18n("ratingwindow", "helptext");
					elems.helplink.text(wot.i18n("ratingwindow", "helplink"))
						.addClass("comment");
				} else {
					helptext = wot.i18n("reputationlevels",
						wot.getlevel(wot.reputationlevels, t).name);
					elems.helplink.text("").removeClass("comment");
				}
			} else {
				elems.helplink.text("").removeClass("comment");
			}

			if (helptext.length) {
				elems.helptext.text(helptext).css("display", "block");
			} else {
				elems.helptext.hide();
			}
		});
	},

	updatecontents: function()
	{
		var cached = this.getcached();

		/* update current rating state */
		this.updatestate(this.current.target, cached);

		/* target */
		if (this.current.target && cached.status == wot.cachestatus.ok) {
			$("#wot-title-text").text(
				this.current.decodedtarget || this.current.target);
		} else if (cached.status == wot.cachestatus.busy) {
			$("#wot-title-text").text(wot.i18n("messages", "loading"));
		} else if (cached.status == wot.cachestatus.error) {
			$("#wot-title-text").text(wot.i18n("messages", "failed"));
		} else {
			$("#wot-title-text").text(wot.i18n("messages",
				this.current.status || "notavailable"));
		}

		/* reputations */
		wot.components.forEach(function(item) {
			if (wot.ratingwindow.settings["show_application_" + item.name]) {
				$("#wot-rating-" + item.name + ", #wot-rating-" + item.name +
					"-border").css("display", "block");
			} else {
				$("#wot-rating-" + item.name + ", #wot-rating-" + item.name +
					"-border").hide();
			}

			$("#wot-rating-" + item.name + "-reputation").attr("reputation",
				(cached.status == wot.cachestatus.ok) ?
					wot.getlevel(wot.reputationlevels,
						cached.value[item.name] ?
						cached.value[item.name].r : -1).name : "");

			$("#wot-rating-" + item.name + "-confidence").attr("confidence",
				(cached.status == wot.cachestatus.ok) ?
					wot.getlevel(wot.confidencelevels,
						cached.value[item.name] ?
						cached.value[item.name].c : -1).name : "");
		});

		/* ratings */
		this.updateratings();

		/* message */
		if (this.usercontent.message.text) {
			$("#wot-message-text")
				.attr("url", this.usercontent.message.url || "")
				.attr("status", this.usercontent.message.type || "")
				.text(this.usercontent.message.text);
			$("#wot-message").show();
		} else {
			$("#wot-message").hide();
		}

		/* user content */
		$(".wot-user").hide();

		this.usercontent.content.forEach(function(item, index) {
			if (item.bar && item.length != null && item.label) {
				$("#wot-user-" + index + "-header").text(item.bar);
				$("#wot-user-" + index + "-bar-text").text(item.label);
				$("#wot-user-" + index + "-bar-image").attr("length",
						item.length).show();
			} else {
				$("#wot-user-" + index + "-header").text("");
				$("#wot-user-" + index + "-bar-text").text("");
				$("#wot-user-" + index + "-bar-image").hide();
			}

			$("#wot-user-" + index + "-text").attr("url", item.url || "");

			if (item.notice) {
				$("#wot-user-" + index + "-notice").text(item.notice).show();
			} else {
				$("#wot-user-" + index + "-notice").hide();
			}

			if (item.text) {
				$("#wot-user-" + index + "-text").text(item.text);
				$("#wot-user-" + index).css("display", "block");
			}
		});

		/* partner */
		$("#wot-partner").attr("partner", wot.partner || "");

		/* resize the pop-up window */
		wot.post("rating", "resizepopup", {
			height: $("#wot-ratingwindow").height() + 20
		});
	},

	update: function(data)
	{
		try {
			this.current = data || {};
			this.updatecontents();
		} catch (e) {
			wot.log("ratingwindow.update: failed with " + e + "\n", true);
		}
	},

	hide: function()
	{
		wot.ratingwindow.finishstate();
		window.close();
	},

	loadsettings: function(ondone)
	{
		var prefs = [
			"accessible",
		];

		wot.components.forEach(function(item) {
			prefs.push("show_application_" + item.name);
		});

		this.settings = this.settings || {};

		wot.prefs.load(prefs, function(name, value) {
				wot.ratingwindow.settings[name] = value;
			}, ondone);
	},

	onload: function()
	{
		wot.bind("message:status:update", function(port, data) {
			wot.ratingwindow.usercontent = data.usercontent;
			wot.ratingwindow.update(data.data);
		});

		wot.listen("status");

		/* accessibility */
		$("#wot-header-logo, " +
				"#wot-header-button, " +
				".wot-header-link, " +
				"#wot-title-text, " +
				".wot-rating-reputation, " +
				".wot-rating-slider, " +
				".wot-rating-helplink, " +
				"#wot-scorecard-content, " +
				".wot-scorecard-text, " +
				".wot-user-text, " +
				"#wot-message-text")
			.toggleClass("accessible", this.settings.accessible);

		/* texts */
		wot.components.forEach(function(item) {
			$("#wot-rating-" + item.name +
				"-header").text(wot.i18n("components", item.name) + ":");
		});

		[	{	selector: "#wot-header-link-guide",
				text: wot.i18n("ratingwindow", "guide")
			}, {
				selector: "#wot-header-link-settings",
				text: wot.i18n("ratingwindow", "settings")
			}, {
				selector: "#wot-title-text",
				text: wot.i18n("messages", "initializing")
			}, {
				selector: "#wot-rating-header-wot",
				text: wot.i18n("ratingwindow", "wotrating")
			}, {
				selector: "#wot-rating-header-my",
				text: wot.i18n("ratingwindow", "myrating")
			}, {
				selector: "#wot-scorecard-visit",
				text: wot.i18n("ratingwindow", "viewscorecard")
			}, {
				selector: "#wot-scorecard-comment",
				text: wot.i18n("ratingwindow", "addcomment")
			}, {
				selector: "#wot-partner-text",
				text: wot.i18n("ratingwindow", "inpartnership")
			}
		].forEach(function(item) {
			$(item.selector).text(item.text);
		});

		if (wot.partner) {
			$("#wot-partner").attr("partner", wot.partner);
		}

		/* user interface event handlers */

		$("#wot-header-logo").bind("click", function() {
			wot.ratingwindow.navigate(wot.urls.base);
		});

		$("#wot-header-link-settings").bind("click", function() {
			wot.ratingwindow.navigate(wot.urls.settings);
		});
		$("#wot-header-link-guide").bind("click", function() {
			wot.ratingwindow.navigate(wot.urls.settings + "/guide");
		});

		$("#wot-header-button").bind("click", function() {
			wot.ratingwindow.hide();
		});

		$("#wot-title").bind("click", function() {
			/* TODO: enable the add-on if disabled */
		});

		$(".wot-rating-helplink, #wot-scorecard-comment").bind("click",
			function(event) {
				if (wot.ratingwindow.current.target) {
					wot.ratingwindow.navigate(wot.urls.scorecard +
						encodeURIComponent(wot.ratingwindow.current.target) +
						"/comment");
				}
				event.stopPropagation();
			});

		$("#wot-scorecard-comment-container").hover(
			function() {
				$("#wot-scorecard-visit").addClass("inactive");
			},
			function() {
				$("#wot-scorecard-visit").removeClass("inactive");
			});

		$("#wot-scorecard-content").bind("click", function() {
			if (wot.ratingwindow.current.target) {
				wot.ratingwindow.navigate(wot.urls.scorecard +
					encodeURIComponent(wot.ratingwindow.current.target));
			}
		});

		$(".wot-user-text").bind("click", function() {
			var url = $(this).attr("url");
			if (url) {
				wot.ratingwindow.navigate(url);
			}
		});

		$("#wot-message").bind("click", function() {
			var url = $("#wot-message-text").attr("url");
			if (url) {
				wot.ratingwindow.navigate(url);
			}
		});

		$(".wot-rating-stack").bind("mousedown", function(e) {
			var c = $(this).attr("component");
			var t = wot.ratingwindow.getrating(e, this);
			wot.ratingwindow.state.down = c;
			wot.ratingwindow.setstate(c, t);
			wot.ratingwindow.updateratings({ name: c, t: t });
		});

		$(".wot-rating-stack").bind("mouseup", function(e) {
			wot.ratingwindow.state.down = -1;
			/* opera: no unload event, so finish after every click */
			wot.ratingwindow.finishstate();
		});

		$(".wot-rating-stack").bind("mousemove", function(e) {
			var c = $(this).attr("component");
			var t = wot.ratingwindow.getrating(e, this);

			if (wot.ratingwindow.state.down == c) {
				wot.ratingwindow.setstate(c, t);
			} else {
				wot.ratingwindow.state.down = -1;
			}

			wot.ratingwindow.updateratings({ name: c, t: t });
		});

		$("#wot-ratingwindow").bind("click", function(e) {
			event.stopPropagation();
		});

		$("body").bind("click", function(e) {
			wot.ratingwindow.hide();
		});

		$(window).unload(function() {
			/* submit ratings and update views */
			wot.ratingwindow.finishstate();
		});

		wot.post("update", "status");
	}
}});

$(document).ready(function() {
	wot.ratingwindow.loadsettings(function() {
		wot.ratingwindow.onload();
	});
});
