// -----------------------------------------------------------------------------
//
// Prerender some content into a target element whilst waiting for further data
// from the server.
//
// -----------------------------------------------------------------------------

define([
  "jquery",
  "lib/utils/template",
  "lib/mixins/page_state",
  "lib/utils/on_transition_end"
], function($, Template, withPageState, onTransitionEnd) {

  "use strict";

  function Prerender() {
    this.$listener = $("#js-row--content");
    this.template = $("#tmpl-prerender").text();
    this.template && this.$listener.length && this.listen();
  }

  withPageState.call(Prerender.prototype);

  // ---------------------------------------------------------------------------
  // Subscribe to Events
  // ---------------------------------------------------------------------------

  Prerender.prototype.listen = function() {
    this.$listener.on(":lightbox/open", this._prerenderContent.bind(this));
    this.$listener.on(":lightbox/navigate", this._prerenderNextPrevious.bind(this));
  };

  // ---------------------------------------------------------------------------
  // Private Functions
  // ---------------------------------------------------------------------------

  Prerender.prototype._getContainerDimensions = function() {
    return $(".js-prerender-container").find(".js-layer-content")[0].getBoundingClientRect();
  };

  Prerender.prototype._useElementIfAvailable = function($element, selector) {
    return $element.find(selector).length ? $element.find(selector) : $element;
  };

  Prerender.prototype._getNextPreviousHtml = function($element) {
    return $element.find(".js-prerender-content")[0].outerHTML;
  };

  Prerender.prototype._getNewContent = function($element) {
    return $(Template.render(this.template, {
      title: $element.find(".js-prerender-title").html(),
      content: $element.find(".js-prerender-content").html()
    }));
  };

  Prerender.prototype._prerenderContent = function(event, data) {
    $(data.target).html(this._getNewContent($(data.opener)));
    this.$listener.trigger(":prerender/complete");
  };

  Prerender.prototype._prerenderNextPrevious = function(event, data) {
    var direction = $(data.opener).data("direction");
    if (!direction) return this._prerenderContent(null, data);

    var transitionAmounts = this._getPrerenderTransitionAmounts(direction),
        $prerenderPanel = this._useElementIfAvailable(this._getNewContent($(data.opener)), ".js-prerender-panel"),
        $prerenderContainer = $(data.target).find(".js-prerender-container");

    // Add our prerendered content into an offscreen panel and then
    // transition it into place, mimicking the movement
    $prerenderContainer
      .append($prerenderPanel.css(transitionAmounts.panel))
      .addClass("will-transition").css(transitionAmounts.container);

    // Copy the html into the original panel and move it back instantly,
    // removing the dummy panel. This allows us to not maintain state.
    onTransitionEnd({
      $listener: $prerenderContainer,
      delay: 500,
      fn: function() {
        this.$listener.trigger(":prerender/complete");
        $prerenderContainer.find(".js-layer-content").html(this._getNextPreviousHtml($prerenderPanel));
        $prerenderPanel.remove();
        $prerenderContainer.removeClass("will-transition").css("transform", "translateX(0)");
      }.bind(this)
    });

  };

  Prerender.prototype._getPrerenderTransitionAmounts = function(direction) {
    var panelDimensions = this._getContainerDimensions(),
        offset = this.getViewPort() + panelDimensions.left;

    if (direction == "next") {
      return {
        panel: { left: offset },
        container: { transform: "translateX(" + -1 * this.getViewPort() + "px)" }
      };
    }
    return {
      panel: { right: offset },
      container: { transform: "translateX(" + this.getViewPort() + "px)" }
    };
  };

  return Prerender;

});
