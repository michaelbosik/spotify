const fs = require('fs');
const mime = require('mime');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const querystring = require('querystring');
const request = require('request');
const app = express();
const port = 3000;
const SpotifyStrategy = require('passport-spotify').Strategy;
const client_id = 'da70dd0556874f0189eb6c64543eef72';
const client_secret = 'c11bdf5f5886434aac3b5dbe1f02984b';
const redirect_uri = 'http://localhost:3000/callback';

let access_token = '';

passport.use(
    new SpotifyStrategy({
      clientID: client_id,
      clientSecret: client_secret,
      callbackURL: redirect_uri,
    },
    function(accessToken, refreshToken, expires_in, profile, done) {
      access_token = accessToken;
      process.nextTick(function() {
        return done(null, profile);
      });
    })
);

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(session({secret: 'spotify-secret', resave: true, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());

const sendFile = function( response, filename ) {
  const type = mime.getType( filename );
  fs.readFile( filename, function( err, content ) {
    if ( err === null ) {
      response.writeHeader( 200, {'Content-Type': type});
      response.end( content );
    } else {
      response.writeHeader( 404 );
      response.end( '404 Error: File Not Found' );
    }
  });
};

//Orders the chosen playlist based on the given parameters, creating a new playlist and sending to spotify
const generatePlaylist = function(name, parameters){

};

app.get('/', function(request, response) {
  sendFile( response, './index.html' );
});

app.get('/style.css', function(request, response) {
  sendFile( response, './styles/style.css' );
});

app.get('/bundle.js', function(request, response) {
  sendFile( response, './js/bundle.js' );
});

app.get('/main.js', function(request, response) {
  sendFile( response, './js/main.js' );
});

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, db.get('users').find({id: user.id}).value());
});

app.get('/login-spotify',
    passport.authenticate('spotify', {successRedirect: redirect_uri, failureRedirect: '/'})
);

app.get('/callback',
    passport.authenticate('spotify', {failureRedirect: '/'}),
    function(req, res) {
      res.redirect('/');
    }
);

app.get('/user', function(req, res){
  res.end(loggedIn);
});

app.get('/logout', function(req, res) {
  loggedIn = '';
  req.session.destroy();
  res.redirect('/');
});

//returns a series of objects which are {image, name} for all a user's playlists
app.get('/getPlaylists', function(req, res) {
  //res.end(db.get('queue[0]'));
});

//Receives the parameters for designing the custom playlist from the frontend.
app.post('/sendParams', function(req, res) {
  let name = req.body.name;
  let params = req.body.params;
  let retVal = generatePlaylist(name, params);
  res.end(JSON.stringify(retVal));
});

app.listen( process.env.PORT || port );