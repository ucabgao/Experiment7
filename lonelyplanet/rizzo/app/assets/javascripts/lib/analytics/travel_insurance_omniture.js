require([ "jquery", "lib/analytics/analytics" ], function($, Analytics) {

  "use strict";

  var analytics = new Analytics();
  if (window.lp.hasOwnProperty("tracking") && window.lp.tracking.hasOwnProperty("eVar12") && window.lp.tracking.eVar12 !== "dest essential information") {
    analytics.trackView();
  }

  // Set up Omniture event handlers

  var windowUnloadedFromSubmitClick = false;

  // If the user clicks anywhere else on the page, reset the click tracker
  $(document).on("click", function() {
    windowUnloadedFromSubmitClick = false;
  });

  // When the user clicks on the submit button, track that it's what
  // is causing the onbeforeunload event to fire (below)
  $(document).on("click", "button.cta-button-primary", function(e) {
    windowUnloadedFromSubmitClick = true;
    e.stopPropagation();
  });

  // Before redirection (which the WN widget does, it's not a form submit)
  // if the user clicked on the submit button, track click with Omniture and GA
  window.onbeforeunload = function() {
    if (windowUnloadedFromSubmitClick) {

      if (window.lp.analytics.api && window.lp.analytics.api.trackEvent) {

        var destinations = $("#selected-destinations li").map(function() {
          return $(this).text().replace(/[^a-zA-Z()\d\s:]/, "").trim();
        }).get().join("|");

        if (!$(".js-travel-widget .input-validation-errors").length) {
          window.lp.analytics.api.trackEvent({
            category: "Partner",
            action:    "Click",
            label: [
              "partner:worldnomads",
              "type:Insurance",
              "name:" + destinations
            ].join("|")
          });
        }
      }

      window.s.events = "event42";
      window.s.t();
    }
  };
});
