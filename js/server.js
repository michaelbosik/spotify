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

app.get('/search', (req, res) => {
  if (!req.user) {
    req.user = {
      token: 'invalid'
    };
  }
  const results = {
    url: `https://api.spotify.com/v1/search?${querystring.stringify(req.query)}&type=track`,
    headers: {
      Authorization: `Bearer ${req.user.token}`,
    },
    json: true,
  };
  request.get(results, (err, response, body) => {
    if (err) {
      console.log(err);
    }
    res.json(body);
  });
});

app.post('/queue', function(req, res) {
  db.get('queue').push({
    id: req.body.id,
    spotify_id: req.body.spotify_id,
    song_name: req.body.song_name,
    artist_name: req.body.artist_name,
    artist_id: req.body.artist_id,
    length: req.body.length,
    added_by: req.body.user,
    country_list: req.body.country_list
  }).write();
  db.update('count', (n) => n + 1).write();
  res.end(JSON.stringify(db.get('queue').find({spotify_id: req.body.spotify_id}).value()));
});

app.get('/getSong', function(req, res) {
  res.end(db.get('queue[0]'));
});

app.get('/getQueue', function(req, res) {
  res.end(JSON.stringify(db.get('queue').value()));
});

app.get('/queueLen', function(req, res) {
  res.end(JSON.stringify(db.get('count').value()));
});

app.listen( process.env.PORT || port );