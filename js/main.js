var settings = [
    {
        key: "Danceability",
        value: 0
    },
    {
        key: "Instrumentalness",
        value: 0
    },
    {
        key: "Speechiness",
        value: 0
    },
    {
        key: "Valence",
        value: 0
    },
    {
        key: "Energy",
        value: 0
    },
    {
        key: "Acousticness",
        value: 0
    }
]

function init() {
    google.charts.load('current', {'packages':['corechart']});
    $.get('/user', function(data) {
      if (data) {
        document.getElementById('log-in-modal').style.display = 'none';
        changeSetting("Danceability", 70);
        changeSetting("Instrumentalness", 40);
        changeSetting("Speechiness", 30);
        changeSetting("Valence", 30);
        changeSetting("Energy", 50);
        changeSetting("Acousticness", 10);
        getPlaylists();
      } else {
        document.getElementById('log-in-modal').style.display = 'block';
      }
    });
    document.getElementById('settings').style.visibility = 'hidden';
}

function changeSetting(key, value){
    document.getElementById(key).value = value;
    settings.forEach(
        function(setting){
            if(setting.key == key){
                setting.value = value * 0.01;
            }
        }
    )
    document.getElementById(key).previousSibling.innerHTML = key + ": " + value;
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
            document.getElementById('settings').style.visibility = 'visible';
        }
    });
}

function sortList(id){
    $.post('/sendParams', {
        id: id,
        params: JSON.stringify(settings),
    }, function(data, status){
        if(status == "success"){
            document.getElementById("tableDiv").innerHTML = 
            "<div id='chart' style='width: 100%; min-height: 500px;'></div>"+
            "<button class='reset btn' onclick='s.getPlaylists()'><p>Sort Again</p></button>";
            
            plotData(data.name, data.songs, data.scores);
        }
    });
}

function renderItem(listID, item){
    
    if(item.images.length == 0)
        item.images[0] = {
            height: 640,
            url: "https://www.freepnglogos.com/uploads/spotify-logo-png/logo-spotify-png-7.png",
            width: 640
        }

    document.getElementById(listID).innerHTML += 
    "<div class='playlistItem' onclick=s.sortList('"+item.id+"')><img class='playlistImage' src='"+
    item.images[0].url+"'><p>"+item.name+"</p></div>"
}

function plotData(name, songs, scores) {

        let songData = [
            ['Song', 'Relevancy Score'],
        ];

        for(let i = 0; i < songs.length; i++){
            songData.push([songs[i], scores[i]]);
        }

        var data = google.visualization.arrayToDataTable(songData);

        var options = {
          title: name,
          curveType: 'function',
          legend: { position: 'bottom' }
        };

        var chart = new google.visualization.LineChart(document.getElementById('chart'));

        chart.draw(data, options);
}

module.exports = {init, changeSetting, sortList, getPlaylists};