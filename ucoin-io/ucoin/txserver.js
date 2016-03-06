var async      = require('async');
var util       = require('util');
var parsers    = require('./app/lib/streams/parsers/doc');
var PeerServer = require('./peerserver');

function TxServer (dbConf, overrideConf, interceptors, onInit) {

  var logger  = require('./app/lib/logger')(dbConf.name);

  var selfInterceptors = [
    {
      // Transaction
      matches: function (obj) {
        return obj.inputs ? true : false;
      },
      treatment: function (server, obj, next) {
        async.waterfall([
          function (next){
            server.TransactionsService.processTx(obj, next);
          },
          function (tx, next){
            server.emit('transaction', tx);
            next(null, tx);
          },
        ], next);
      }
    }
  ];

  PeerServer.call(this, dbConf, overrideConf, selfInterceptors.concat(interceptors || []), onInit || []);

  var that = this;

  this._read = function (size) {
  };

  this._listenBMA = function (app) {
    this.listenNode(app);
    this.listenWOT(app);
    this.listenBlock(app);
    this.listenNET(app);
    this.listenTX(app);
  };

  this.listenTX = function (app) {
    var transactions = require('./app/controllers/transactions')(that);
    app.post('/tx/process',           transactions.parseTransaction);
    app.get( '/tx/sources/:pubkey',   transactions.getSources);
  };
}

util.inherits(TxServer, PeerServer);

module.exports = TxServer;
