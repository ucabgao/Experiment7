// ---------------------------------------------------------------------------
//
// Datepicker
//
// ---------------------------------------------------------------------------

define([ "jquery", "picker", "pickerDate", "pickerLegacy" ], function($) {

  "use strict";

  var defaults = {
    callbacks: {},
    dateFormat: "d mmm yyyy",
    dateFormatLabel: "yyyy/mm/dd",
    target: "#js-row--content",
    startSelector: "#js-av-start",
    endSelector: "#js-av-end",
    startLabelSelector: ".js-av-start-label",
    endLabelSelector: ".js-av-end-label"
  };

  function Datepicker(args) {
    this.config = $.extend({}, defaults, args);
    this.target = $(this.config.target);

    this.target.length && this.init();
  }

  Datepicker.prototype.init = function() {
    var config = this.config,
        options = this._getOptions();

    this.inDate = this.target.find(config.startSelector);
    this.outDate = this.target.find(config.endSelector);
    this.inLabel = $(config.startLabelSelector);
    this.outLabel = $(config.endLabelSelector);
    this.firstTime = !!this.inDate.val();
    this.day = 86400000;

    this.inDate.pickadate(options.inDate);
    this.outDate.pickadate(options.outDate);

    this.listen();
  };

  Datepicker.prototype.listen = function() {

    this.inDate.one("change", this._handleInDateChange.bind(this));
  };

  // -------------------------------------------------------------------------
  // Private Functions
  // -------------------------------------------------------------------------

  Datepicker.prototype._getOptions = function() {
    var _this = this,
        config = this.config,
        today = [],
        tomorrow = [],
        d = new Date(),
        inOpts, outOpts,
        pickFuture = config.pickFuture === true,
        pickPast = config.pickPast === true;

    today.push(d.getFullYear(), d.getMonth(), d.getDate());
    tomorrow.push(d.getFullYear(), d.getMonth(), (d.getDate() + 1));

    inOpts = {
      format: config.dateFormat,
      selectMonths: config.selectMonths,
      selectYears: config.selectYears,
      onSet: function() {
        _this._dateSelected(
          this.get("select", _this.config.dateFormatLabel),
          "start"
        );
      }
    };

    outOpts = {
      format: config.dateFormat,
      selectMonths: config.selectMonths,
      selectYears: config.selectYears,
      onSet: function() {
        _this._dateSelected(
          this.get("select", _this.config.dateFormatLabel),
          "end"
        );
      }
    };

    if (!pickFuture && pickPast) {
      inOpts.max = today;
      outOpts.max = today;
    } else if ((pickFuture && !pickPast) || (!pickFuture && !pickPast)) {
      inOpts.min = today;
      outOpts.min = tomorrow;
    }

    return { inDate: inOpts, outDate: outOpts };
  };

  Datepicker.prototype._handleInDateChange = function() {
    this.outDate.pickadate("picker").open(false);
  };

  Datepicker.prototype._dateSelected = function(date, type) {
    var inDate = this.inDate.data("pickadate"),
        outDate = this.outDate.data("pickadate");

    if (type === "start") {

      if (!this._isValidEndDate()) {
        outDate.set("select", new Date(date).getTime() + this.day);
      }

      this.inLabel.text(this.inDate.val());

    } else if (type === "end") {

      if (!this._isValidEndDate() || this.firstTime) {
        inDate.set("select", new Date(date).getTime() - this.day);
      }

      this.outLabel.text(this.outDate.val()).removeClass("is-hidden");
    }

    this.firstTime = false;

    if (this.config.callbacks.onDateSelect) {
      this.config.callbacks.onDateSelect(date, type);
    }
  };

  Datepicker.prototype._inValue = function() {
    var inDate = this.inDate.data("pickadate");

    return new Date(inDate.get("select", this.config.dateFormatLabel));
  };

  Datepicker.prototype._outValue = function() {
    var outDate = this.outDate.data("pickadate");

    return new Date(outDate.get("select", this.config.dateFormatLabel));
  };

  Datepicker.prototype._isValidEndDate = function() {
    return this._inValue() < this._outValue();
  };

  return Datepicker;

});
