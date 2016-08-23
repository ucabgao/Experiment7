var amqp = require('amqp');
var fs = require('fs');
var onMessage = require('./onMessage.js');
var amqp_hacks = require('./amqp-hacks.js');

// Load the configuration JSON file
var config = JSON.parse(fs.readFileSync('./config.json'));

var connection = amqp.createConnection({
  host: config.rabbit.host,
  port: config.rabbit.port,
  login: config.rabbit.username,
  password: config.rabbit.password,
  authMechanism: 'AMQPLAIN',
  vhost: '/',
  ssl:  { 
          enabled : false
        }
});

connection.on('ready', function onConnection() {
  connection.queue('notifications', {
      autoDelete: false,
      durable: true
    },
    onQueue(queue));
});

function onQueue(queue) {
  console.log('Connected to RabbitMQ @', config.rabbit.host, "...");
  console.log('To exit press CTRL-c');
  queue.subscribe({ ack: true,
                    prefetchCount: 1
                  }, function(message, headers, deliveryInfo, queue){
                    onMessage(message, headers, deliveryInfo, queue)
                  });
}

process.on('uncaughtException', function onUncaughtException(err) {
  console.log(err.stack);
  throw err;
});
