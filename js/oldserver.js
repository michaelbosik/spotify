const fs   = require( 'fs' ),
      mime = require( 'mime' ),
      express = require('express'),
      session = require('express-session'),
      passport = require('passport'), //Used for OAuth
      bodyParser = require('body-parser'),
      querystring = require('querystring'),
      cookieParser = require('cookie-parser'),
      request = require('request'),
      app = express(),
      port = 3000,
      low = require('lowdb'), //Database LowDB
      FileSync = require('lowdb/adapters/FileSync'),
      adapter = new FileSync('db.json'),
      db = low(adapter),
      SpotifyStrategy = require('passport-spotify').Strategy, //Spotify Credentials
      client_id = 'da70dd0556874f0189eb6c64543eef72',
      client_secret = 'c11bdf5f5886434aac3b5dbe1f02984b',
      redirect_uri = 'http://a3-michaelbosik.glitch.me/callback';

let loggedIn = '',
    client_token = "";

passport.use(
    new SpotifyStrategy({
        clientID: client_id,
        clientSecret: client_secret,
        callbackURL: redirect_uri
    },
    function(accessToken, refreshToken, expires_in, profile, done) {
        let user = db.get('users').find({id: profile.id})
            if (user.value()) {
                user.assign({ token: accessToken }).write()
            } else {
                db.get('users')
                    .push({
                        id: profile.id,
                        displayName: profile.displayName,
                        token: accessToken
                    })
                    .write()
            }
        client_token = accessToken;
        loggedIn = profile.id;
        process.nextTick(function() {
            return done(null, profile);
        });
    })
);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({ secret: 'spotify-secret', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());

db.defaults({ queue: [], users: [] }).write()

const sendFile = function( response, filename ) {
   const type = mime.getType( filename ) 

   fs.readFile( filename, function( err, content ) {

     if( err === null ) {
       response.writeHeader( 200, { 'Content-Type': type })
       response.end( content )

     }else{
       response.writeHeader( 404 )
       response.end( '404 Error: File Not Found' )
     }
   })
}

//File Handlers
app.get("/", function (request, response) {
    sendFile( response, 'index.html' );
});
  
app.get("/style.css", function (request, response) {
    sendFile( response, 'style.css' );
});

app.get("/queue.html", function (request, response) {
    sendFile( response, 'queue.html' );
});

app.get("/queue.js", function (request, response) {
    sendFile( response, 'queue.js' );
});

app.get("/token", function(req, res){
    res.end(client_token);
})

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, db.get('users').find({id: user.id}).value());
});

//Spotify API
app.get('/login-spotify', 
    passport.authenticate('spotify', { successRedirect: redirect_uri, failureRedirect: '/' })
);

app.get('/callback',
  passport.authenticate('spotify', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/queue.html');
  }
);

app.get('/user', function(req, res){
    res.end(loggedIn);
})

app.get('/logout', function(req, res) {
    req.session.destroy();
});

app.get('/search', (req, res) => {
    if (!req.user) {
        req.user = {
            token: 'invalid'
        }
    }
    let results = {
        url: `https://api.spotify.com/v1/search?${querystring.stringify(req.query)}&type=track`,
        headers: {
            Authorization: `Bearer ${req.user.token}`,
        },
        json: true
    }
    request.get(results, (err, response, body) => {
        if (err) {
            console.log(err)
        }
        res.json(body);
    });
})

app.get('/getQueue', function(req, res) {
    res.end(JSON.stringify(db.get('queue').value()));
});

app.get('/queueLen', function(req, res) {
    res.end(JSON.stringify(db.get('count').value()));
})

app.post('/queue', function (req, res) {
    db.get('queue').push({
        id: req.body.id,
        spotify_uri: req.body.spotify_uri,
        song_name: req.body.song_name,
        artist_name: req.body.artist_name,
        length: req.body.length,
        added_by: req.body.user
    }).write();
    db.update('count', n => n + 1).write()
    res.end(JSON.stringify(db.get('queue').find({spotify_uri: req.body.spotify_uri}).value()));
});

app.post('/delete', function (req, res) {
    db.get('queue').remove({id: req.body.id}).write();
    res.end('Deleted item');
});

app.listen( process.env.PORT || port );