
/*
 * Module dependencies
 */

var passport = require('passport')
  , keys = require('./keys.json')
  , mongoose = require('mongoose')
  , gravatar = require('gravatar');

var User = mongoose.model('User');

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user){
    done(err, user);
  });
});

module.exports = function(app) {

// Helpers

var saveSubdomain = function(req, res, next) {
  if(!req.session) req.session = {};
  req.session.subdomain = (req.subdomains.length && req.subdomains[0]) || '';
  next();
};

var redirectSubdomain = function(req, res) {
  var domain = app.get('config').host;
  if (req.session.subdomain !== '') {
    domain = req.session.subdomain + '.' + domain;
  }
  res.redirect('http://' + domain + ':' + app.get('config').port);
};


app.set('providers', Object.keys(keys));

for(var strategy in keys) {

  (function(provider){

    app.get('/auth/' + provider, saveSubdomain,
passport.authenticate(provider));
    app.get('/auth/' + provider + '/callback', passport.authenticate(provider, {
failureRedirect: '/' }), redirectSubdomain);

    var Strategy = require('passport-' + provider).Strategy;
    passport.use(new Strategy(keys[provider],
    function(token, tokenSecret, profile, done) {
      User.findOne({provider_id: profile.id, provider: provider}, function(err,
user){

        function setPicture(){
          if(profile.photos && profile.photos.length && profile.photos[0].value) {
            user.picture =  profile.photos[0].value.replace('_normal', '_bigger');
          } else if(profile.provider == 'facebook') {
            user.picture = "https://graph.facebook.com/" + profile.id + "/picture";
            user.picture += "?width=73&height=73";
          } else {
            user.picture = gravatar.url(user.email || '', {s: '73'});
          }

          user.picture = user.picture || '/default_avatar.png';
        }

        if(!user) {
          var user = new User();
          user.provider = provider;
          user.provider_id = profile.id;

          if(profile.emails && profile.emails.length && profile.emails[0].value)
            user.email = profile.emails[0].value;

          setPicture();
          
          user.name = profile.displayName || '';
          user.username = profile.username || profile.displayName;
          user.save(function(err, user){  
            done(null, user);
          });
        } else { 

          //Update user picture provider if url changed
          var picBefore = user.picture;
          setPicture();
          
          if (user.picture !== picBefore){
            user.save(function(err, user){  
              done(null, user);
            });
          }
          else {
            done(null, user);
          }

        }
      });
    }));

  })(strategy);

}

// Anonymous auth for test porpouses 

if(process.env.NODE_ENV == "test") {

  var BasicStrategy = require('passport-http').BasicStrategy;

  var u;
  var user = new User({provider: 'basic', provider_id: 1, username: 'test'});
  user.save(function(err, usr){ u = usr; });

  passport.use(new BasicStrategy({}, function(username, password, done) {
    process.nextTick(function () {
      return done(null, u);
    });
  }));

  app.all('*', passport.authenticate('basic'));

}

};

