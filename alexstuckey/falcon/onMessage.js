module.exports = function(message, headers, deliveryInfo, queue){
  var fs = require('fs');
  var argv = require('optimist').argv;

  // Load the configuration JSON file
  var config = JSON.parse(fs.readFileSync('./config.json'));

  // Parsing the message delivered by RabbitMQ into an object
  var payload = JSON.parse(message.data.toString('utf-8'));

  console.log("Received message: ", payload);

  var isSupported = (config.supportedMethods.indexOf(payload[1])==-1);

  if (isSupported) {
    console.log('Unsupproted method:', payload[1]);
  } else {
    var method_string = './methods/' + payload[1] + '.js';
    var method = require(method_string);
    console.log("Using method:", method.info['name']);

    // If simulate flag has been set
    if (!argv.s) {
      method.send(payload[3], payload[2]);
    } else {
      console.log("Simulating message send");
    }
  }

  // Acknowledges the message, should only be done if the notification
  // has been successfully processed. Need to check if it has been first.
  queue.queue.shift();

}
