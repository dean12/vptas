var mymap = L.map('mapid').setView([-36.5083988,145.0811384], 7);

var mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';

L.tileLayer(
        'http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
            attribution: '&copy; ' + mapLink + ' Contributors',
            maxZoom: 15,
        }).addTo(mymap);


// Adding the polygon data to mymap
L.TopoJSON = L.GeoJSON.extend({
  addData: function(jsonData) {
    if (jsonData.type === "Topology") {
      for (key in jsonData.objects) {
        geojson = topojson.feature(jsonData, jsonData.objects[key]);
        L.GeoJSON.prototype.addData.call(this, geojson);
      }
    }
    else {
      L.GeoJSON.prototype.addData.call(this, jsonData);
    }
  }
});

var topoLayer = new L.TopoJSON();

$.getJSON('/lga_map')
  .done(addTopoData);

function addTopoData(topoData){
  topoLayer.addData(topoData);
  topoLayer.addTo(mymap);
  topoLayer.eachLayer(handleLayer);
}

// Colouring the polygon data
var colorScale = chroma
  .scale(['#D5E3FF', '#003171'])
  .domain([0,1]);

//topoLayer.eachLayer(handleLayer);



function handleLayer(layer){
  var randomValue = Math.random();
    fillColor = colorScale(randomValue).hex();

  layer.setStyle({
    fillColor : fillColor,
    fillOpacity: 0.6,
    color:'#555',
    weight:1,
    opacity:1
  });

  layer.on({
    mouseover: enterLayer,
    mouseout: leaveLayer
  });
}



function enterLayer(e){
  var layer = e.target
  layer.bringToFront();
  info.update(layer.feature.properties);
  layer.setStyle({
    weight:3,
    opacity: 1
  });

  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
}

function leaveLayer(){
  info.update();
  this.bringToBack();
  this.setStyle({
    weight:1,
    opacity:1
  });
}

// Popup tooltip that shows what LGA is under mouseover
var info = L.control();

info.onAdd = function (mymap) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
};

// method that we will use to update the control based on feature properties passed
info.update = function (props) {
    //console.log(props.vic_lga__2);
    this._div.innerHTML = '<h4>Local Government Area</h4>' +  (props ?
        '<b>' + props.vic_lga__2 + '</b>'
        : 'Hover over a LGA');
};

info.addTo(mymap);
