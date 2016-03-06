define(function() {

  "use strict";

  function GoogleAnalytics(selectors) {
    for (var selector in selectors) {
      this[selector] = selectors[selector];
    }
  }

  GoogleAnalytics.prototype.track = function() {

    if (!(window.lp.analytics.api && window.lp.analytics.api.trackEvent)) {
      return;
    }

    window.lp.analytics.api.trackEvent({
      category: "Partner",
      action:   "Click",
      label: [
        "partner:" + "Cartrawler",
        "type:"    + "Car Rental",
        "name:"    + this.$locationStart.val()
      ].join("|")
    });

  };

  return GoogleAnalytics;

});
