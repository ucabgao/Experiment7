#!/usr/bin/env node

// requires
var Sequelize = require('sequelize');
var jsonld = require('jsonld');
var crypto = require('crypto');
var promises = jsonld.promises;

/**
* setup database
* @param  {string} dialect type of db mysql|sqlite
* @param  {string} storage file used for sqlite, default ./credit.db
* @return {Object} sequelize db object
*/
function setupDB(config) {
  var sequelize;
  var defaultStorage = 'credit.db';

  if (config.dialect === 'sqlite') {
    if (!config.storage) {
      config.storage = defaultStorage;
    }

    sequelize = new Sequelize(config.database, config.username, config.password, {
      host: config.host,
      dialect: config.dialect,
      storage: config.storage
    });
  } else {
    sequelize = new Sequelize(config.database, config.username, config.password, {
      host: config.host,
      dialect: config.dialect
    });
  }
  return sequelize;
}


/**
* insert credit
* @param  {Object} sequelize db object
*/
function insert(credit, sequelize, config) {

  // main
  console.log('source : ' + credit["https://w3id.org/cc#source"]);
  console.log('amount : ' + credit["https://w3id.org/cc#amount"]);
  console.log('unit : ' + credit["https://w3id.org/cc#currency"]);
  console.log('destination : ' + credit["https://w3id.org/cc#destination"]);
  console.log('description : ' + credit["http://purl.org/dc/terms/description"]);
  console.log('timestamp : ' + credit["https://w3id.org/cc#created"]);
  console.log('wallet : ' + config.wallet);


  credit["http://purl.org/dc/terms/description"] = credit["http://purl.org/dc/terms/description"] || null;
  credit["http://purl.org/dc/terms/created"] = credit["http://purl.org/dc/terms/created"] || null;
  config.wallet = config.wallet || null;

  var existsSql = "SELECT * FROM Credit where source = '"+ credit["https://w3id.org/cc#source"] + "' and destination = '" + credit["https://w3id.org/cc#destination"] + "' and amount = " + credit["https://w3id.org/cc#amount"];
  existsSql +=  " and description = :description ";
  existsSql +=  " and timestamp = :created ";
  existsSql +=  " and wallet = :wallet ";

  console.log(existsSql);

  sequelize.query(existsSql, { replacements: { description: credit["http://purl.org/dc/terms/description"],
                               created: credit["http://purl.org/dc/terms/created"], wallet: config.wallet } }).then(function(res) {
    console.log('checking if row exists');
    console.log(res);
    if (res[0][0]) {
      console.log('row exists');
      throw ('row exists');
    } else {
      console.log('row does not exist');
      console.log('Getting balance');
      var balanceSql = "SELECT * FROM Ledger where source = '" + credit["https://w3id.org/cc#source"] + "' and wallet = :wallet ";
      return sequelize.query(balanceSql, { replacements: { wallet: config.wallet } });
    }
  }).then(function(res){
    if (res[0][0] && res[0][0].amount) {
      console.log('balance is ' + res[0][0].amount);
      if (res[0][0].amount >= credit["https://w3id.org/cc#amount"]) {
        console.log('funds available');


        if (credit["https://w3id.org/cc#timestamp"]) {
          credit["https://w3id.org/cc#timestamp"] = credit["https://w3id.org/cc#timestamp"].replace(' ', 'T');
          if (credit["https://w3id.org/cc#timestamp"].charAt(credit["https://w3id.org/cc#timestamp"].length-1) != 'Z') {
            credit["https://w3id.org/cc#timestamp"] += 'Z';
          }
        } else {
          credit["https://w3id.org/cc#timestamp"] = new Date().toISOString();
        }


        var doc = {
          "https://w3id.org/cc#created": { "@value" : credit["https://w3id.org/cc#created"], "@type" : "http://www.w3.org/2001/XMLSchema#dateTime" } ,
          "https://w3id.org/cc#source": { "@id": credit["https://w3id.org/cc#source"] },
          "https://w3id.org/cc#amount": { "@value" : credit["https://w3id.org/cc#amount"], "@type" : "http://www.w3.org/2001/XMLSchema#decimal" } ,
          "https://w3id.org/cc#destination": { "@id": credit["https://w3id.org/cc#destination"] },
          "https://w3id.org/cc#currency": { "@id": credit["https://w3id.org/cc#currency"] },
          "@type": "https://w3id.org/cc#Credit"
        };
        console.log(doc);
        return promises.normalize(doc, {format: 'application/nquads'});

      } else {
        throw ('not enough funds');
      }
    } else {
      throw ('could not find balance');
    }
  }).then(function(doc){
    console.log('Sucessfully normalized doc to json ld!');
    var hash = crypto.createHash('sha256').update(doc).digest('base64');
    console.log(hash);

    var id = 'ni:///sha-256;' + new Buffer(hash).toString('base64').replace('+', '-').replace('/', '_').replace('=', '');
    credit['@id'] = id;
    console.log(credit);



    var insertSql = "INSERT INTO Credit(\`@id\`, `source`, `destination`, `amount`, `timestamp`, `currency`";
    if (credit["https://w3id.org/cc#description"]) insertSql += ", `description`";
    if (config.wallet) insertSql += ", `wallet`";
    insertSql += ") values ( '" + credit['@id'] + "', '"+ credit["https://w3id.org/cc#source"] + "' , '" + credit["https://w3id.org/cc#destination"] + "' , " + credit["https://w3id.org/cc#amount"];
    insertSql += " , '" + credit["https://w3id.org/cc#timestamp"] + "'" + " , '" + credit["https://w3id.org/cc#currency"] + "'";
    if (credit["http://purl.org/dc/terms/description"]) insertSql+= " , '" + credit["http://purl.org/dc/terms/description"] + "'";
    if (config.wallet) insertSql+= " , '" + config.wallet + "'";
    insertSql += " )";

    console.log(insertSql);

    return sequelize.query(insertSql);

  }).then(function(res){
    console.log('decrementing source');
    var decrementSql = "UPDATE Ledger set amount = amount - " + credit["https://w3id.org/cc#amount"] + " where source = '"+ credit["https://w3id.org/cc#source"] + "' and wallet = :wallet";
    return sequelize.query(decrementSql, { replacements: { wallet: config.wallet } });

  }).then(function(res){
    console.log('incrementing or creating destination');
    var checkSql = "SELECT * from Ledger where `source` =  '" + credit["https://w3id.org/cc#destination"] + "' and wallet = :wallet";
    return sequelize.query(checkSql, { replacements: { wallet: config.wallet } });
  }).then(function(res){
    var incrementSql;
    if (res[0][0] && res[0][0].amount) {
      if (config.wallet) {
        incrementSql = "UPDATE Ledger set `amount` = `amount` + " + credit["https://w3id.org/cc#amount"] + " where `source` =  '" + credit["https://w3id.org/cc#destination"] + "' and wallet = '"+ config.wallet +"'";
      } else {
        incrementSql = "UPDATE Ledger set `amount` = `amount` + " + credit["https://w3id.org/cc#amount"] + " where `source` =  '" + credit["https://w3id.org/cc#destination"] + "'";
      }
    } else {
      if (config.wallet) {
        incrementSql = "INSERT into Ledger (`source`, `amount`, `wallet`) values ('"+ credit["https://w3id.org/cc#destination"] +"', "+credit["https://w3id.org/cc#amount"] +", '"+ config.wallet +"')";
      } else {
        incrementSql = "INSERT into Ledger (`source`, `amount`) values ('"+ credit["https://w3id.org/cc#destination"] +"', "+credit["https://w3id.org/cc#amount"] +")";
      }
    }
    return sequelize.query(incrementSql);

  }).then(function() {
    console.log('Complete');
    sequelize.close();
    // hook

  }).catch(function(err){
    console.log('Failed to insert credit.', err);
  });
}

/**
* createDB function
* @param  {Object} config [description]
*/
function createDB(config) {
  // vars
  var sequelize;

  // run main
  sequelize = setupDB(config);
  return sequelize;
}

/**
* create tables
 * @param  {Object} sequelize db object
 */
function createTables(sequelize) {
  var create_credit = 'CREATE TABLE Credit ( \
    `@id` TEXT, \
    `source` TEXT, \
    `amount` REAL, \
    `currency` VARCHAR(255) DEFAULT \'https://w3id.org/cc#bit\', \
    `destination` TEXT, \
    `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, \
    `context` TEXT, \
    `description` TEXT, \
    `wallet` TEXT \
  );';

  var create_ledger = 'CREATE TABLE Ledger ( \
    `source` TEXT, \
    `amount` REAL, \
    `currency` VARCHAR(255) DEFAULT \'https://w3id.org/cc#bit\', \
    `wallet` TEXT \
  );';

  var create_genesis = 'CREATE TABLE Genesis ( \
    `source` TEXT, \
    `amount` REAL, \
    `currency` VARCHAR(255) DEFAULT \'https://w3id.org/cc#bit\', \
    `wallet` TEXT \
  );'

  sequelize.query(create_credit).then(function(res) {
  }).then(function(){
    sequelize.query(create_ledger);
  }).then(function(){
    sequelize.query(create_genesis);
  }).then(function(){
    console.log('Sucessfully created tables!');
  }).catch(function(err){
    console.log('Failed to create tables.', err);
  }).then(function() {
    console.log('Complete');
  });
}


/**
 * createDB function
 * @param  {Object} config [description]
 */
function createDB(config) {
  // vars
  var sequelize;

  // run main
  sequelize = setupDB(config);
  createTables(sequelize);
}

/**
 * get balance
 * @param  {Object} sequelize db object
 */
function getBalance(source, sequelize, config) {
  var coinbase = 'https://w3id.org/cc#coinbase';
  var currency = 'https://w3id.org/cc#bit';
  var initial  = 1000000;

  if (!config.wallet) {
    config.wallet = null;
  }

  sequelize.query(coinbaseSql,  { replacements: { wallet: config.wallet, source: source } }).then(function(res) {
    return res;
  }).catch(function(err){
    console.log('Balance Failed.', err);
  }).then(function(res) {
    if (res[0][0]) {
      console.log(res[0][0].amount);
      sequelize.close();
    }
  });
}

/**
 * genesis init
 * @param  {Object} sequelize db object
 */
function genesisInit(sequelize, config) {
  var coinbase = 'https://w3id.org/cc#coinbase';
  var currency = 'https://w3id.org/cc#bit';
  var initial  = 1000000;

  if (!config.wallet) {
    config.wallet = null;
  }

  var coinbaseSql = 'Insert into Ledger values ( \''+ coinbase +'\', '+ initial +', \''+ currency +'\', :wallet );';
  var genesisSql  = 'Insert into Genesis values ( \''+ coinbase +'\', '+ initial +', \''+ currency +'\', :wallet );';

  sequelize.query(coinbaseSql,  { replacements: { wallet: config.wallet } }).then(function(res) {
  }).then(function(){
    sequelize.query(genesisSql,  { replacements: { wallet: config.wallet } });
  }).then(function(){
    console.log('Genesis successful!');
  }).catch(function(err){
    console.log('Genesis Failed.', err);
  }).then(function() {
    console.log('Complete');
  });
}

/**
 * genesis function
 * @param  {Object} config [description]
 */
function genesis(config) {
  // vars
  var sequelize;

  // run main
  sequelize = setupDB(config);
  genesisInit(sequelize, config);
}

/**
 * balance function
 * @param  {Object} config [description]
 */
function balance(source, config) {
  // vars
  var sequelize;

  // run main
  sequelize = setupDB(config);
  var res = getBalance(source, sequelize, config);
}


/**
 * get reputation
 * @param  {Object} sequelize db object
 */
function getReputation(source, sequelize, config) {
  var coinbase = 'https://w3id.org/cc#coinbase';
  var currency = 'https://w3id.org/cc#bit';
  var initial  = 1000000;

  if (!config.wallet) {
    config.wallet = null;
  }

  var coinbaseSql = 'Select sum(amount) amount from Credit where destination = :source and wallet = :wallet ;';

  sequelize.query(coinbaseSql,  { replacements: { wallet: config.wallet, source: source } }).then(function(res) {
    return res;
  }).catch(function(err){
    console.log('Reputation Failed.', err);
  }).then(function(res) {
    if (res[0][0]) {
      console.log(res[0][0].amount);
      sequelize.close();
    }
  });
}

/**
 * reputation function
 * @param  {Object} config [description]
 */
function reputation(source, config) {
  // vars
  var sequelize;

  // run main
  sequelize = setupDB(config);
  var res = getReputation(source, sequelize, config);
}

/**
* insert credit
* @param  {Object} sequelize db object
*/
function insert(credit, sequelize, config) {

  // main
  console.log('source : ' + credit["https://w3id.org/cc#source"]);
  console.log('amount : ' + credit["https://w3id.org/cc#amount"]);
  console.log('unit : ' + credit["https://w3id.org/cc#currency"]);
  console.log('destination : ' + credit["https://w3id.org/cc#destination"]);
  console.log('description : ' + credit["http://purl.org/dc/terms/description"]);
  console.log('timestamp : ' + credit["https://w3id.org/cc#created"]);
  console.log('wallet : ' + config.wallet);


  credit["http://purl.org/dc/terms/description"] = credit["http://purl.org/dc/terms/description"] || null;
  credit["http://purl.org/dc/terms/created"] = credit["http://purl.org/dc/terms/created"] || null;
  config.wallet = config.wallet || null;

  var existsSql = "SELECT * FROM Credit where source = '"+ credit["https://w3id.org/cc#source"] + "' and destination = '" + credit["https://w3id.org/cc#destination"] + "' and amount = " + credit["https://w3id.org/cc#amount"];
  existsSql +=  " and description = :description ";
  existsSql +=  " and timestamp = :created ";
  existsSql +=  " and wallet = :wallet ";

  console.log(existsSql);

  sequelize.query(existsSql, { replacements: { description: credit["http://purl.org/dc/terms/description"],
                               created: credit["http://purl.org/dc/terms/created"], wallet: config.wallet } }).then(function(res) {
    console.log('checking if row exists');
    console.log(res);
    if (res[0][0]) {
      console.log('row exists');
      throw ('row exists');
    } else {
      console.log('row does not exist');
      console.log('Getting balance');
      var balanceSql = "SELECT * FROM Ledger where source = '" + credit["https://w3id.org/cc#source"] + "' and wallet = :wallet ";
      return sequelize.query(balanceSql, { replacements: { wallet: config.wallet } });
    }
  }).then(function(res){
    if (res[0][0] && res[0][0].amount) {
      console.log('balance is ' + res[0][0].amount);
      if (res[0][0].amount >= credit["https://w3id.org/cc#amount"]) {
        console.log('funds available');


        if (credit["https://w3id.org/cc#timestamp"]) {
          credit["https://w3id.org/cc#timestamp"] = credit["https://w3id.org/cc#timestamp"].replace(' ', 'T');
          if (credit["https://w3id.org/cc#timestamp"].charAt(credit["https://w3id.org/cc#timestamp"].length-1) != 'Z') {
            credit["https://w3id.org/cc#timestamp"] += 'Z';
          }
        } else {
          credit["https://w3id.org/cc#timestamp"] = new Date().toISOString();
        }


        var doc = {
          "https://w3id.org/cc#created": { "@value" : credit["https://w3id.org/cc#created"], "@type" : "http://www.w3.org/2001/XMLSchema#dateTime" } ,
          "https://w3id.org/cc#source": { "@id": credit["https://w3id.org/cc#source"] },
          "https://w3id.org/cc#amount": { "@value" : credit["https://w3id.org/cc#amount"], "@type" : "http://www.w3.org/2001/XMLSchema#decimal" } ,
          "https://w3id.org/cc#destination": { "@id": credit["https://w3id.org/cc#destination"] },
          "https://w3id.org/cc#currency": { "@id": credit["https://w3id.org/cc#currency"] },
          "@type": "https://w3id.org/cc#Credit"
        };
        console.log(doc);
        return promises.normalize(doc, {format: 'application/nquads'});

      } else {
        throw ('not enough funds');
      }
    } else {
      throw ('could not find balance');
    }
  }).then(function(doc){
    console.log('Sucessfully normalized doc to json ld!');
    var hash = crypto.createHash('sha256').update(doc).digest('base64');
    console.log(hash);

    var id = 'ni:///sha-256;' + new Buffer(hash).toString('base64').replace('+', '-').replace('/', '_').replace('=', '');
    credit['@id'] = id;
    console.log(credit);



    var insertSql = "INSERT INTO Credit(\`@id\`, `source`, `destination`, `amount`, `timestamp`, `currency`";
    if (credit["https://w3id.org/cc#description"]) insertSql += ", `description`";
    if (config.wallet) insertSql += ", `wallet`";
    insertSql += ") values ( '" + credit['@id'] + "', '"+ credit["https://w3id.org/cc#source"] + "' , '" + credit["https://w3id.org/cc#destination"] + "' , " + credit["https://w3id.org/cc#amount"];
    insertSql += " , '" + credit["https://w3id.org/cc#timestamp"] + "'" + " , '" + credit["https://w3id.org/cc#currency"] + "'";
    if (credit["http://purl.org/dc/terms/description"]) insertSql+= " , '" + credit["http://purl.org/dc/terms/description"] + "'";
    if (config.wallet) insertSql+= " , '" + config.wallet + "'";
    insertSql += " )";

    console.log(insertSql);

    return sequelize.query(insertSql);

  }).then(function(res){
    console.log('decrementing source');
    var decrementSql = "UPDATE Ledger set amount = amount - " + credit["https://w3id.org/cc#amount"] + " where source = '"+ credit["https://w3id.org/cc#source"] + "' and wallet = :wallet";
    return sequelize.query(decrementSql, { replacements: { wallet: config.wallet } });

  }).then(function(res){
    console.log('incrementing or creating destination');
    var checkSql = "SELECT * from Ledger where `source` =  '" + credit["https://w3id.org/cc#destination"] + "' and wallet = :wallet";
    return sequelize.query(checkSql, { replacements: { wallet: config.wallet } });
  }).then(function(res){
    var incrementSql;
    if (res[0][0] && res[0][0].amount) {
      if (config.wallet) {
        incrementSql = "UPDATE Ledger set `amount` = `amount` + " + credit["https://w3id.org/cc#amount"] + " where `source` =  '" + credit["https://w3id.org/cc#destination"] + "' and wallet = '"+ config.wallet +"'";
      } else {
        incrementSql = "UPDATE Ledger set `amount` = `amount` + " + credit["https://w3id.org/cc#amount"] + " where `source` =  '" + credit["https://w3id.org/cc#destination"] + "'";
      }
    } else {
      if (config.wallet) {
        incrementSql = "INSERT into Ledger (`source`, `amount`, `wallet`) values ('"+ credit["https://w3id.org/cc#destination"] +"', "+credit["https://w3id.org/cc#amount"] +", '"+ config.wallet +"')";
      } else {
        incrementSql = "INSERT into Ledger (`source`, `amount`) values ('"+ credit["https://w3id.org/cc#destination"] +"', "+credit["https://w3id.org/cc#amount"] +")";
      }
    }
    return sequelize.query(incrementSql);

  }).then(function() {
    console.log('Complete');
    sequelize.close();
    // hook

  }).catch(function(err){
    console.log('Failed to insert credit.', err);
  });
}


module.exports = { insert        : insert,
                   setupDB       : setupDB,
                   createDB      : createDB,
                   createTables  : createTables,
                   balance       : balance,
                   getBalance    : getBalance,
                   genesis       : genesis,
                   genesisInit   : genesisInit,
                   reputation    : reputation,
                   getReputation : getReputation,
                   insert        : insert
                   };
