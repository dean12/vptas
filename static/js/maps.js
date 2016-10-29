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

//Gets the origins of travel data;
//Needs to pass the name of the LGA we are interested in to back end
function getTravelOriginData(key_destination_lga){
  var origins_json;
  $.getJSON('/get_travel_origins', {
        key_destination_lga: key_destination_lga
      },
    function(data){origins_json = data});
  return   origins_json

}

function getTravelDestinationData(key_destination_lga){
  destinations_json = $.getJSON('/get_travel_destinations', {
        key_destination_lga: key_destination_lga
      });
  return destinations_json


}


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
    mouseout: leaveLayer,
    click: updateChoropleth_Origins,
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

function updateChoropleth_Origins(e){
  var layer = e.target
  // Declare a global variable that can be used by the updateChoro... function
  // This contains the name of the LGA area clicked on
  lga_area = layer.feature.properties.vic_lga__3

  // origin_choropleth_intensities is the json output from the ajax
  // call to Flask
  origin_choropleth_intensities =  getTravelOriginData(lga_area)

  colorScale = chroma
    .scale(['#D5E3FF', '#003171'])
    .domain([0,getMaxValue(origin_choropleth_intensities)]);

  // Get data corresponding to LGA clicked on
  // Need to pass in 'layer' as well as JSON containing {Origin: count} data
  topoLayer.eachLayer(updateChoroColours_Origins)

}

function updateChoroColours_Origins(layer){
  var specific_lga_intensity = origin_choropleth_intensities[layer.feature.properties.vic_lga__3]

  // Defines the fill colour for this specific LGA area
  fillColor = colorScale(specific_lga_intensity).hex();


  layer.setStyle({
    fillColor : fillColor,
    fillOpacity: 0.6,
    color:'#555',
    weight:1,
    opacity:1
  });

}

function getMaxValue(locations_json){
  var values = $.map(locations_json, function(el) { return el; });
  var max_value = Math.max(...values);
  return max_value
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
        '<b>' + props.vic_lga__3 + '</b>'
        : 'Hover over a LGA');
};

info.addTo(mymap);
