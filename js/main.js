
function init() {
    $.get('/user', function(data) {
      user=data;
      if (user) {
        document.getElementById('log-in-modal').style.display = 'none';
      } else {
        document.getElementById('log-in-modal').style.display = 'block';
      }
    });
}

function getPlaylists(){
    //hit server GET - returns list of names
    //generateTable("User Lists", names)
}

function plotData(data){
    //chart data somehow Google Charts API?
}

function generateTable(id, list){
    //iterate through list
    //renderItem(id, item)
}

function sortList(id, params){
    //hit server POST(id, params)
    //onOK plotData(data)
}

function renderItem(listID, item){
    //use listID to create row items
}

module.exports = {init, changeSetting};