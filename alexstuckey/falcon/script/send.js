var amqp = require('amqp');
var fs = require('fs');
var amqp_hacks = require('../amqp-hacks');

var config = JSON.parse(fs.readFileSync('./config.json'));

var connection = amqp.createConnection(
  { 
    host: config.rabbit.host,
    port: config.rabbit.port,
    login: config.rabbit.username,
    password: config.rabbit.password,
    authMechanism: 'AMQPLAIN',
    vhost: '/',
    ssl:  { 
            enabled : false
          }
  }
);
  
connection.on('ready', function(){
    // msg = [ datetime, method, message, address ];
    var msg = [
      Math.round((new Date()).getTime() / 1000),
      process.argv[2],
      [
        process.argv[3],
        process.argv[4]
      ],
      process.argv[5]
    ];

    connection.publish('notifications', JSON.stringify(msg));
    console.log(" [x] Sent:", msg);

    amqp_hacks.safeEndConnection(connection);
}); 
