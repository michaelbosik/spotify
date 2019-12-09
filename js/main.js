var settings = [
    {
        key: "danceability",
        value: 0
    },
    {
        key: "instrumentalness",
        value: 0
    },
    {
        key: "speechiness",
        value: 0
    },
    {
        key: "valence",
        value: 0
    },
    {
        key: "loudness",
        value: 0
    },
    {
        key: "acousticness",
        value: 0
    }
]

var user_playlists = []

function init() {
    $.get('/user', function(data) {
      user=data;
      if (user) {
        document.getElementById('log-in-modal').style.display = 'none';
        getPlaylists();
      } else {
        document.getElementById('log-in-modal').style.display = 'block';
      }
    });
}

function changeSetting(key, value){
    settings.forEach(
        function(setting){
            if(setting.key == key){
                setting.value = value;
            }
        }
    )
}

function getPlaylists(){
    $.get('/getPlaylists', function(data, status) {
        if(status == 'success'){
            //console.log("data is", data);
            user_playlists = data.outputLists;
            generateTable("User Playlists", user_playlists);
        }
    })
}

function plotData(data){
    //chart data somehow Google Charts API?
}

function generateTable(listID, list){
    list.forEach(
        function(listItem){
            renderItem(listID, listItem)
        }
    )
}

function sortList(id, params){
    //hit server POST(id, params)
    //onOK plotData(data)
}

function renderItem(listID, item){
    //use listID to create row items
    console.log(listID, item.name);
}

module.exports = {init, changeSetting};