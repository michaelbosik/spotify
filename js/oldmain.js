let cooldown = 0,
    user = 'null',
    count = 0,
    token = null,
    player = null,
    queue = [];

function logOut(){
    $(document).get('/logout', function(data, status){
        if(status == 'success'){console.log("Logged out of session.")}
    });   	
    window.location.href = '/';
}

function search(e){
    document.getElementById('searchTable').innerHTML = '';
    e.preventDefault()
    let q = $("#searchText").val(),
        params = $.param({q: q});
    fetch(`/search?${params}`, {
        credentials: 'include'
    }).then((res) => res.json())
    .then((data) => {
        if ('error' in data) {
            alert(data.error.message);
            return;
        }
        for(let i = 0; i < data.tracks.items.length; i++){
            renderItem('searchTable', data.tracks.items[i], null);
        }
    }).catch((err) => console.log(err))
    return false;
}

$(document).on('click', '.songItem', function(event){
    if(!cooldown){
        cooldown = 1;
        setTimeout(function(){ cooldown = 0 }, 500);
        $.get('/queueLen', function(data){count=data});
        $.post('/queue',
            {
                id: count,
                spotify_uri: event.currentTarget.id,
                song_name: event.currentTarget.childNodes[0].innerHTML,
                artist_name: event.currentTarget.childNodes[1].innerHTML,
                length: event.currentTarget.childNodes[3].innerHTML,
                added_by: user
            },
        function(data, status){
            if(status === 'success'){
                renderItem('queueTable', JSON.parse(data), user);
                addToQ(JSON.parse(data).spotify_uri);
            }
        });
    }
    event.preventDefault();
});

$(document).on('click', '.delete', function(event){
    if(!cooldown){
        cooldown = 1;
        setTimeout(function(){ cooldown = 0 }, 500);
        $.post('/delete',
            {
                id: event.currentTarget.id
            },
        function(data, status){
            if(status === 'success'){
                updateQueue();
            }
        });
    }
    event.preventDefault();
});

function renderItem(table, item, user){
    let ms = item.duration_ms,
        min = Math.floor((ms/1000/60) << 0),
        sec = Math.floor((ms/1000) % 60),
        time = min+":"+sec;
    if(table == "searchTable")
        document.getElementById(table).innerHTML += "<tr class='songItem' id="+item.uri+"><td class='song'>"+item.name+"</td><td class='artist'>"+item.artists[0].name+"</td><td class='album'>"+item.album.name+"</td><td class='length'>"+time+"</td></tr>";
    else
        document.getElementById(table).innerHTML += "<tr id="+item.spotify_uri+"><td class='song'>"+item.song_name+"</td><td class='artist'>"+item.artist_name+"</td><td class='length'>"+item.length+"</td><td class='added'>"+user+"</td><td class='delete' id="+item.id+"><i class='fas fa-trash'></i></td></tr>";
}

function updateQueue(){
    document.getElementById('queueTable').innerHTML = '';
    console.log("updatingqueue");
    let queue = {};
    $.get('/getQueue', function(data, status){
        if(status == 'success'){
            queue = JSON.parse(data);
            for(let i = 0; i < queue.length; i++){
                renderItem('queueTable', queue[i], user);
            }
        }
    });
}

window.onload = function() {
    document.querySelector('#searchForm').addEventListener('submit', search);
    $.get('/user', function(data){user=data});
    $.get('/queueLen', function(data){count=data});
    $.get('/token', function(data){token=data});
    updateQueue();
}


// const play = ({
//     spotify_uri,
//     playerInstance: {
//         _options: {
//             token,
//             id
//         }
//     }
// }) => {fetch(`https://api.spotify.com/v1/me/player/play?device_id=${id}`, {
//             method: 'PUT',
//             body: JSON.stringify({ uris: [spotify_uri] }),
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${token}`
//             },
//         });
//     };

// function addToQ(uri){
//     queue[queue.length] = uri;
//     playQ();
// }

// function playQ(){
//     while(queue.length > 0){
//         if(!player.getCurrentState()){
//             if(queue.length > 1){
//                 for(let i = 0; i < queue.length; i++){
//                     queue[i] = queue[i+1];
//                 }
//                 queue.pop();
//             }
//             playSong(queue[0]);
//         }
//     }
//     playSong(queue[0]);
// }

// function playSong(uri){
//     play({
//         playerInstance: new Spotify.Player({ name: "The Q" }),
//         spotify_uri: uri
//     });
// }

// window.onSpotifyWebPlaybackSDKReady = () => {
//     player = new Spotify.Player({
//         name: 'The Q',
//         getOAuthToken: callback => {
//           callback(token);
//         },
//         volume: 0.5
//     });
//     player.connect().then(success => {
//         if (success) {
//           console.log('The Web Playback SDK successfully connected to Spotify!');
//         }
//     })
//     player.addListener('ready', ({ device_id }) => {
//         console.log('The Web Playback SDK is ready to play music!');
//         console.log('Device ID', device_id);
//     })
// };