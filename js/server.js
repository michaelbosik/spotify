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
const redirect_uri = 'http://playsort.glitch.me';
var Promise = require('promise');

var logged_user_id = '';

let access_token = '';
let playlistData = '';
let sel_name = '';
let uri_name_objs = [];

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

//returns the name for a given song uri that was previously queried
const getNameFromUri = function(uri){
    for(let i=0; i<uri_name_objs.length; i++){
        if(uri_name_objs[i].uri === uri){
            return uri_name_objs[i].name;
        }
    }
}

//returns the elements sorted by bell curve
const bellCurve = function(arr){
    let toggle = true;
    let result = [];
    arr.forEach(song=>{
        song.name = getNameFromUri(song.song.uri);
       if(toggle){
           result.push(song);
       } else{
           result.unshift(song);
       }
       toggle =!toggle;
    });
    return result;
};

const sortUris = function(audio_data, params){
    //sorts the audio data and returns an ordered uri list
    let uris = [];
    let sorted = false;
    audio_data.forEach(song =>{
      let features = [
        {
            key: "Danceability",
            value: song.danceability
        },
        {
            key: "Instrumentalness",
            value: song.instrumentalness
        },
        {
            key: "Speechiness",
            value: song.speechiness
        },
        {
            key: "Valence",
            value: song.valence
        },
        {
            key: "Energy",
            value: song.energy
        },
        {
            key: "Acousticness",
            value: song.acousticness
        }
      ]

      let similar = [];
      let threshold = 0.2;
      let i = 0;

      features.forEach(function(feature){
        let setting = params.find( ({ key }) => key === feature.key );
        let min = setting.value - threshold, max = setting.value + threshold;
        similar[i++] = feature.value > min && feature.value < max;
      })

      let score = 0;

      similar.forEach(function(val){
        if(val)
          score++;
      })

      if(score > 1){
        if(!sorted){
          sorted = [];
          sorted.push({song: song, score: score})
        } else {
          for(let i = 0; i < sorted.length; i++){
            if (score > sorted[i].score){
              sorted.splice(i, 0, {song: song, score: score})
              i = sorted.length;
            } else if (i == sorted.length-1){
              sorted.push({song: song, score: score});
              i = sorted.length;
            }
          }
        }
      }
    });

    //sort sorted into curve here
    sorted = bellCurve(sorted);
    sorted.forEach(function(song){
      uris.push(song.song.uri);
    });

    return {uris: uris, song_info: sorted}
};

const sortAndAddTracks = function(data, params){
    // console.log("sortandadd", data);
 let audio_data = data.audio_data.audio_features;
 let playlist_name = data.playlist_name;
 let plId = data.id;
 let sortedData = sortUris(audio_data, params);
 let uriList = sortedData.uris;

//  console.log("About to send add request");
    let results = {
        url: 'https://api.spotify.com/v1/playlists/'+plId+'/tracks',
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
        json: true,
        body:{
            uris: uriList
        }
    };

    return new Promise(function(resolve, reject) {
        request.post(results, (err, response, body) => {
            if (err) {
                console.log(err)
            }
            // console.log("ADDED URIS TO PLAYLIST", body);
            resolve({response: body, status: "added", data: sortedData.song_info, playlist_name: playlist_name});
        });
    });

};

const getAudioInfo = function(data){
    let songs = data.items;
    let querystring = '';
    uri_name_objs = [];
    songs.forEach(s =>{
        querystring += s.track.id +',';
        //console.log("track info", s.track);
        uri_name_objs.push({id:s.track.id, uri:s.track.uri, name:s.track.name});
    });
    querystring = querystring.slice(0, -1);

    let results = {
        url: 'https://api.spotify.com/v1/audio-features/?ids='+querystring,
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
        json: true
    };

    return new Promise(function(resolve, reject) {
        request.get(results, (err, response, body) => {
            if (err) {
                console.log(err)
            }
            // console.log("got audio data");
            resolve(body);
        });
    });

};

const getTracksFromUrl = function(url){
    // console.log("getting track from url", url);
    let results = {
        url: url,
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
        json: true
    };
    return new Promise(function(resolve, reject){
        request.get(results, (err, response, body) => {
        if (err) {
            console.log(err)
        }
        resolve(body);
        });
    });
};

const getPlaylistById = function(id){
    // console.log(playlistData);

    let rd = {
        id: id,
        name: "nf",
        songs: "nf"
    };
   playlistData.forEach(list =>{
      //  console.log("name, tracks:", list.name, list.tracks);
       if(list.id === id){
           rd =  {
               id: id,
               name: list.name,
               songs: list.tracks
           };
       }
   });
   return rd;
};

//returns the id of a created playlist
const createPlaylist = function(data, name){
    // console.log("----------Creating Playlist------------------");

    let results = {
        url: 'https://api.spotify.com/v1/users/' + logged_user_id + '/playlists',
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
        json: true,
        body:{
            "name": name + "_Sorted",
            "description": "Generated via Bosik-Duff PlaySort",
            "public": false
        }
    };

    return new Promise(function(resolve, reject) {
        request.post(results, (err, response, body) => {
            if (err) {
                console.log(err)
            }
            //console.log("playlist_data", body);
            resolve({audio_data: data, id: body.id, playlist_name: body.name});
        });
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
    passport.authenticate('spotify',
        {successRedirect: redirect_uri,
        failureRedirect: '/',
        scope:['playlist-modify-private', 'playlist-read-private'],
        showDialog: true})
);

app.get('/callback',
    passport.authenticate('spotify', {failureRedirect: '/'}),
    function(req, res) {
      res.redirect('/');
    }
);

app.get('/user', function(req, res){
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
  let id = req.body.id;
  var params = JSON.parse(req.body.params);
  let plData = getPlaylistById(id);
  // console.log(plData);

  getTracksFromUrl(plData.songs.href).then(function(data){
    getAudioInfo(data).then(function(data) {
      createPlaylist(data, plData.name).then(function (data) {
        // console.log("About to sort tracks");
        sortAndAddTracks(data, params).then(function (data){
          res.end(JSON.stringify(data));
        });
      });
    });
  });
});

function trimData(data){
    playlistData = data.items; // set global variable
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