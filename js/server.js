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
const client_id = 'c4d49e20497a4a48a126d9eccbfd600e';
const client_secret = '3cfc484c82e547c4a84c843ed608dc51';
const redirect_uri = 'http://localhost:3000/callback';

var logged_user_id = '';

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
const createPlaylist = function(id, parameters){
    console.log("----------Creating Playlist------------------");

    let results = {
        url: 'https://api.spotify.com/v1/users/' + logged_user_id + '/playlists',
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
        json: true,
        data:{
            "name": "New Test Playlist",
            "description": "A Testing Boi",
            "public": false
        }
    };
    request.get(results, (err, response, body) => {
        if (err) {
            console.log(err)
        }
        console.log(body);
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
  logged_user_id = user.id;
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
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
    console.log("/////////USER CALL//////");
    if(access_token){
        res.send(req.body);
    }
});

app.get('/logout', function(req, res) {
  access_token = '';
  logged_user_id = '';
  req.session.destroy();
  res.redirect('/');
});

//returns a series of objects which are {image, name, id} for all a user's playlists
app.get('/getPlaylists', function(req, res) {
    console.log("token is ", access_token);

    if(!logged_user_id){
        res.json({message: 'user not logged in'});
    }

    let results = {
        url: 'https://api.spotify.com/v1/users/' + logged_user_id + '/playlists',
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
        json: true
    };
    request.get(results, (err, response, body) => {
        if (err) {
            console.log(err)
        }
        res.json(trimData(body));
    });
});

//Receives the parameters for designing the custom playlist from the frontend.
app.post('/sendParams', function(req, res) {
    console.log("params sent");
  let id = req.body.id;
  let params = req.body.params;
  let retVal = createPlaylist(id, params); //the statistics of the generated playlist are returned
  res.end(JSON.stringify(retVal));
});

function trimData(data){
    let inputLists = data.items;
    let outputLists = [];
    inputLists.forEach(playlist => {
        let item =
            {
                id: playlist.id,
                images: playlist.images,
                name: playlist.name
            };
        outputLists.push(item);
    });
    return {outputLists};
}

app.listen( process.env.PORT || port );