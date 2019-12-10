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

function init() {
    $.get('/user', function(data) {
      if (data) {
        document.getElementById('log-in-modal').style.display = 'none';
        getPlaylists();
      } else {
        document.getElementById('log-in-modal').style.display = 'block';
      }
    });
    // document.getElementsByClassName('setting').forEach().style.display = 'none';
}

function changeSetting(key, value){
    settings.forEach(
        function(setting){
            if(setting.key == key){
                setting.value = value;
            }
        }
    )
    console.log(settings);
}

function getPlaylists(){
    $.get('/getPlaylists', function(data, status){
        if(status == "success"){
            listID = "userPlaylists";
            document.getElementById("tableDiv").innerHTML = 
            "<div class='playlistTable w-100 h-100' id='"+listID+"'></div>";
            data.outputLists.forEach(
                function(listItem){
                    if(listItem.name.length > 24)
                        listItem.name = listItem.name.substring(0, 20)+"...";
                    renderItem(listID, listItem)
                }
            )
            // document.getElementsByClassName('setting').forEach().style.display = 'block';
        }
    });
}

function plotData(data){
    console.log(data);
    //chart data somehow Google Charts API?
}

function sortList(id){
    $.post('/sendParams', {
        id: id,
        params: settings
    }, function(data, status){
        if(status == "success"){
            plotData(data);
        }
    });
}

function renderItem(listID, item){    
    document.getElementById(listID).innerHTML += 
    "<div class='playlistItem' onclick=s.sortList('"+item.id+"')><img class='playlistImage' src='"+
    item.images[0].url+"'><p>"+item.name+"</p></div>"
}

module.exports = {init, changeSetting, sortList};