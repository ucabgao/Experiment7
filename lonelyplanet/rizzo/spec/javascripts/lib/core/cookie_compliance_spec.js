define([ "jquery", "public/assets/javascripts/lib/core/cookie_compliance" ], function($, CookieCompliance) {

  "use strict";

  beforeEach(function() {
    loadFixtures("cookie_compliance.html");
  });

  describe("Cookie Compliance", function() {

    it("shows a message if the user is in europe and has never seen it", function() {
      spyOn(CookieCompliance.prototype, "mustShow").and.returnValue(true);
      expect($(".js-cookie-compliance")).toHaveClass("is-closed");
      new CookieCompliance();
      expect($(".js-cookie-compliance")).toHaveClass("is-open");
      expect($(".js-cookie-compliance")).not.toHaveClass("is-closed");
    });

    it("doesn't show if the user is in the united states", function() {
      spyOn(CookieCompliance.prototype, "seen").and.returnValue(false);
      spyOn(CookieCompliance.prototype, "inEurope").and.returnValue(false);
      expect($(".js-cookie-compliance")).toHaveClass("is-closed");
      new CookieCompliance();
      expect($(".js-cookie-compliance")).not.toHaveClass("is-open");
      expect($(".js-cookie-compliance")).toHaveClass("is-closed");
    });

    it("doesn't show if the user has already seen it", function() {
      spyOn(CookieCompliance.prototype, "seen").and.returnValue(true);
      spyOn(CookieCompliance.prototype, "inEurope").and.returnValue(true);
      expect($(".js-cookie-compliance")).toHaveClass("is-closed");
      new CookieCompliance();
      expect($(".js-cookie-compliance")).not.toHaveClass("is-open");
      expect($(".js-cookie-compliance")).toHaveClass("is-closed");
    });
  });
});
