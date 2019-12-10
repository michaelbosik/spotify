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
      if (data) {
        document.getElementById('log-in-modal').style.display = 'none';
        getPlaylists();
      } else {
        document.getElementById('#log-in-modal').style.display = 'block';
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
    document.getElementById("tableDiv").innerHTML = 
    "<div class='playlistTable w-100 h-100' id='"+listID+"'></div>";
    list.forEach(
        function(listItem){
            renderItem(listID, listItem)
        }
    )
}

function sortList(id){
    $.ajax({
        type: "POST",
        url: "/sendParams",
        data: {
            name: id,
            params: settings
        },
        success: function(data){
            plotData(data);
        }
    });
}

function renderItem(listID, item){
    
    if(item.name.length > 24)
        item.name = item.name.substring(0, 20)+"...";
    
    document.getElementById(listID).innerHTML += 
    "<div class='playlistItem' onclick=s.sortList('"+item.id+"')><img class='playlistImage' src='"+
    item.images[0].url+"'><p>"+item.name+"</p></div>"
}

module.exports = {init, changeSetting, sortList};