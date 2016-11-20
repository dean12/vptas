// Sets up the basic map
var mymap = L.map('mapid').setView([-38.0331202,142.5570871], 9);

// Imports the 'tile layer from the free open maps'
L.tileLayer(
  'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
    minZoom: 7,
  }).addTo(mymap);

  mymap.createPane('labels');
  mymap.getPane('labels').style.zIndex = 650;
  mymap.getPane('labels').style.pointerEvents = 'none';

  L.tileLayer('http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
    pane: 'labels',
    maxZoom: 14,
    minZoom: 7
  }).addTo(mymap);


  //******* Adding the LGA polygons data to mymap

  // Extends the GeoJSON class to deal with TopoJSON
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
  // Creates a new TopoJSON layer
  var topoLayer = new L.TopoJSON();

// Set default slider value
slider_value = 1
CLICKED = false

  // Adds the TopoJSON polygons to the map and formats the fill/border/opacity
  function addTopoData(topoData){
    topoLayer.addData(topoData);
    topoLayer.addTo(mymap);
    topoLayer.eachLayer(handleLayer);
  }


  // Draw the WARRNAMBOOL hospital cluster

  var circle = L.circle([-38.3794202452, 142.476043917], {
    color: '#8fb5d6',
    fillColor: '#2166ac',
    fillOpacity: 0.5,
    radius: 5000
  }).addTo(mymap);

  circle.on({
    "mouseover": function () {
      circle.setStyle({
        fillOpacity: 1
      })
    },
    "mouseout": function () {
      circle.setStyle({
        fillOpacity: 0.5
      })
    }
  });

  circle.on("click", clusterClick)


var markerClusters

  function clusterClick() {

      $(".sidebar-desc").html("Change the cutoff bounary:");
      $(".slider-horizontal").css('visibility','visible');
    //Change sidebar to show new title
    $(".sidebar-title").html("WARRNAMBOOL")

    // Ajax call to get the polygon data
    if (mymap.hasLayer(topoLayer) == false){
      $.getJSON('/warr_map')
      .done(addTopoData);
    }


    // Get get points and then render them to the map

    $.getJSON('/get_origin_coords', {
      key_destination_lga: "WARRNAMBOOL",
      selected_year: 'All'
    },
    function(data){

      if (typeof markerClusters !== 'undefined') {
          mymap.removeLayer(markerClusters)
      }

      markerClusters = L.markerClusterGroup();

      for ( var i = 0; i < data.length; ++i ){

        if (data[i].Year == document.getElementById( "selectYear" ).value || document.getElementById( "selectYear" ).value == 'All'){
          var popup = data[i].Gender +
          '<br/><b>Description: </b> ' + data[i].Literal +
          '<br/><b>Age Group: </b> ' + data[i].Age_Group +
          '<br/><b>Year: </b> ' + data[i].Year +
          '<br/><b>Count: </b> ' + data[i].Count


          var m = L.marker( [data[i].origin_lat, data[i].origin_lon])
          .bindPopup( popup );

          markerClusters.addLayer( m );
        };
      }

      mymap.addLayer( markerClusters );
    }
  )
}


// Handles the initial formatting of the choropleth
function handleLayer(layer){

  layer.setStyle({
    color:'#555',
    weight:0.8,
    opacity:0.6,
    fillOpacity:0.8,
    fillColor: '#ebbba3'
  });

  layer.on({
    mouseover: enterLayer,
    mouseout: leaveLayer,
  });
}

// Is false when no layer has been clicked.
// True if a layer has been clicked


// Mouseover Enter Layer
function enterLayer(e){
  var layer = e.target
  layer.bringToFront();
  info.update(layer.feature.properties);
  layer.setStyle({
    weight:3,
    opacity: 0.6
  });

  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
  }
}
// Mouseover leave Layer
function leaveLayer(){
  info.update();
  this.bringToBack();
  this.setStyle({
    weight:1,
    opacity:0.6
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

      this._div.innerHTML = '<h4>SA1 Area</h4>' +  (props ?
      '<p>' + '<b>' + 'Population: '+ '</b>' +  props.DistanceMa + '</p>' : '<p> Hover over a SA1 area </p>');

    };

    info.addTo(mymap);



      // Year selector

      document.getElementById( "selectYear" ).onchange = function() {
      var index = this.selectedIndex;
      var changed_year = this.children[index].value;
      clusterClick();
    }

// Slider for distances
// Instantiate a slider
var name_element = document.getElementById('slider-km').value;

document.getElementById( 'slider-km' ).onchange = function() {
  topoLayer.eachLayer(distanceChange);
}

function distanceChange(layer){
  slider_value = document.getElementById( 'slider-km' ).value
  // 100km
  if (slider_value == 1 && layer.feature.properties.hundred == 0){
    layer.setStyle({
      fillOpacity:0.07,
      fillColor: '#2166ac'
    });
  } else if (slider_value == 2 && layer.feature.properties.ninetyfive == 0){
    layer.setStyle({
      fillOpacity:0.07,
      fillColor: '#2166ac'
    });
  } else if (slider_value == 3 && layer.feature.properties.ninety == 0){
    layer.setStyle({
      fillOpacity:0.07,
      fillColor: '#2166ac'
    });
  } else if (slider_value == 4 && layer.feature.properties.eightyfive == 0){
    layer.setStyle({
      fillOpacity:0.07,
      fillColor: '#2166ac'
    });
  }else if (slider_value == 5 && layer.feature.properties.eighty == 0){
    layer.setStyle({
      fillOpacity:0.07,
      fillColor: '#2166ac'
    });
    }


  // If layer.properties."100km" == 1 then render it red, else render it blue
}
