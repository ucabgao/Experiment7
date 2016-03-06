exports.info = {
  name: "email"
};

exports.send = function(address, message) {
  var fs = require('fs');

  // Load the configuration JSON file
  var config = JSON.parse(fs.readFileSync('./config.json'));

  var nodemailer = require('nodemailer');

  var transport = nodemailer.createTransport("SMTP", {
    service: "gmail",
    auth: {
      user: config.SMTP.username,
      pass: config.SMTP.password
    }
  });

  var email = {
    from: config.SMTP.from,
    to: address,
    subject: message[0],
    text: message[1]
  };

  console.log("   sending mail", email);

  transport.sendMail(email, function(error){
    if(error){
      console.log("error occured")
      console.log(error.message)
      return;
    }
    console.log("Send successful")
  });
};
