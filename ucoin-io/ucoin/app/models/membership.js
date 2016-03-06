var mongoose = require('mongoose');
var async    = require('async');
var sha1     = require('sha1');
var _        = require('underscore');
var rawer    = require('../lib/rawer');
var dos2unix = require('../lib/dos2unix');
var Schema   = mongoose.Schema;

var MembershipSchema = new Schema({
  version: String,
  currency: String,
  issuer: { type: String },
  membership: String,
  type: String,
  userid: String,
  current: { type: Boolean, default: false },
  signature: String,
  certts: { type: Date },
  block: String,
  propagated: { type: Boolean, default: false },
  number: Number,
  fpr: String,
  hash: String,
  sigDate: { type: Date, default: function(){ return new Date(0); } },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
});

MembershipSchema.pre('save', function (next) {
  this.updated = Date.now();
  next();
});

MembershipSchema.virtual('pubkey').get(function () {
  return this._pubkey;
});

MembershipSchema.virtual('pubkey').set(function (am) {
  this._pubkey = am;
});

MembershipSchema.virtual('amHash').get(function () {
  return this._amHash;
});

MembershipSchema.virtual('amHash').set(function (am) {
  this._amHash = am;
});

MembershipSchema.methods = {

  keyID: function () {
    return this.issuer && this.issuer.length > 24 ? "0x" + this.issuer.substring(24) : "0x?";
  },
  
  copyValues: function(to) {
    var obj = this;
    ["version", "currency", "issuer", "membership", "amNumber", "hash", "signature", "sigDate"].forEach(function (key) {
      to[key] = obj[key];
    });
  },
  
  inline: function() {
    return [this.issuer, this.signature, this.number, this.fpr, this.certts.timestamp(), this.userid].join(':');
  },
  
  inlineValue: function() {
    return [this.version, this.issuer, this.membership, this.number, this.fpr, this.userid].join(':');
  },
  
  inlineSignature: function() {
    var splits = dos2unix(this.signature).split('\n');
    var signature = "";
    var keep = false;
    splits.forEach(function(line){
      if (keep && !line.match('-----END PGP') && line != '') signature += line + '\n';
      if (line == "") keep = true;
    });
    return signature;
  },
  
  json: function() {
    var obj = this;
    var json = {};
    ["version", "currency", "issuer", "membership"].forEach(function (key) {
      json[key] = obj[key];
    });
    json.date = this.date && this.date.timestamp();
    json.sigDate = this.sigDate && this.sigDate.timestamp();
    json.raw = this.getRaw();
    return { signature: this.signature, membership: json };
  },

  getRaw: function() {
    return rawer.getMembershipWithoutSignature(this);
  },

  getRawSigned: function() {
    return rawer.getMembership(this);
  },

  deleteIfExists: function(done) {
    this.model('Membership').remove({
      "issuer": this.issuer,
      "membership": this.membership,
      "userid": this.userid,
      "certts": this.certts,
      "number": this.number,
      "fpr": this.fpr
    }, function (err) {
      done(err);
    });
  }
}

MembershipSchema.statics.fromInline = function (inlineMS, type, currency) {
  var Membership = this.model('Membership');
  var sp = inlineMS.split(':');
  return new Membership({
    version:    1,
    currency:   currency,
    issuer:     sp[0],
    membership: type,
    type:       type,
    number:     parseInt(sp[2]),
    fpr:        sp[3],
    block:      [sp[2], sp[3]].join('-'),
    fpr:        sp[3],
    certts:     new Date(parseInt(sp[4])*1000),
    userid:     sp[5],
    signature:  sp[1]
  });
}

MembershipSchema.statics.getCurrentInOlderThan = function (exclusiveLimitingDate, done) {
  
  this.find({ current: true, sigDate: { $lt: exclusiveLimitingDate } }, function (err, mss) {
    done(err, mss || []);
  });
}

MembershipSchema.statics.getCurrent = function (issuer, done) {
  
  this
    .find({ current: true, issuer: issuer })
    .sort({ 'sigDate': -1 })
    .limit(1)
    .exec(function (err, mss) {
      done(null, mss.length == 1 ? mss[0] : null);
  });
}

MembershipSchema.statics.getHistory = function (issuer, done) {
  
  this
    .find({ issuer: issuer })
    .sort({ 'sigDate': -1 })
    .exec(done);
}

MembershipSchema.statics.getForHashAndIssuer = function (hash, issuer, done) {
  
  this
    .find({ issuer: issuer, hash: hash })
    .sort({ 'sigDate': -1 })
    .exec(done);
}

MembershipSchema.statics.removeEligible = function (issuer, done) {
  
  this
    .find({ issuer: issuer, eligible: true })
    .remove(done);
}

MembershipSchema.statics.removeFor = function (issuer, done) {
  
  this
    .find({ issuer: issuer })
    .remove(function (err) {
      done(err);
    });
}

module.exports = MembershipSchema;
