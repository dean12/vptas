var mymap = L.map('mapid').setView([-36.5083988,145.0811384], 7);

var mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';

L.tileLayer(
        'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
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
  var randomValue = Math.random(),
    fillColor = colorScale(randomValue).hex();

  layer.setStyle({
    fillColor : fillColor,
    fillOpacity: 0.7,
    color:'#555',
    weight:1,
    opacity:1
  });

  layer.on({
    mouseover: enterLayer,
    mouseout: leaveLayer
  });
}

var $tooltip = $('.country-name');

function enterLayer(){
  var countryName = this.feature.properties.vic_lga__2;
  $tooltip.text(countryName).show();
  this.bringToFront();
  this.setStyle({
    weight:3,
    opacity: 1
  });
}

function leaveLayer(){
  $tooltip.hide();

  this.bringToBack();
  this.setStyle({
    weight:1,
    opacity:1
  });
}
