// Sets up the basic map
var mymap = L.map('mapid').setView([-36.5083988,145.0811384], 7);

// Imports the 'tile layer from the free open maps'
L.tileLayer(
        'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
            maxZoom: 12,
            minZoom: 6,
        }).addTo(mymap);

mymap.createPane('labels');
mymap.getPane('labels').style.zIndex = 650;
mymap.getPane('labels').style.pointerEvents = 'none';

L.tileLayer('http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
        pane: 'labels',
        maxZoom: 12,
        minZoom: 6
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

// Ajax call to get the polygon data
$.getJSON('/lga_map')
  .done(addTopoData);
// Adds the TopoJSON polygons to the map and formats the fill/border/opacity
function addTopoData(topoData){
  topoLayer.addData(topoData);
  topoLayer.addTo(mymap);
  topoLayer.eachLayer(handleLayer);
}

// Colouring the polygon data
// Note: This is overwritten when a LGA is clicked
// This is just the baseline fill
var colorScale = chroma
  .scale(['f1eeec', '#003171'])
  .domain([0,1]);

// Handles the initial formatting of the choropleth
function handleLayer(layer){
  // put in a uniform color scheme over the map
  fillColor = '#999999'

  layer.setStyle({
    fillColor : fillColor,
    fillOpacity: 0.8,
    color:'#555',
    weight:1,
    opacity:0.6
  });

  layer.on({
    mouseover: enterLayer,
    mouseout: leaveLayer,
    click: updateChoropleth_Origins,
  });
}

// Is false when no layer has been clicked.
// True if a layer has been clicked
var CLICKED = false

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

// Called when a LGA is clicked on
function updateChoropleth_Origins(e){
  var layer = e.target
  CLICKED = true
  // Declare a global variable that can be used by the updateChoro... function
  // This contains the name of the LGA area clicked on
  lga_area = layer.feature.properties.vic_lga__3
  $(".sidebar-title").html(lga_area.toProperCase());
  $(".sidebar-desc").html("Persons who travel to " + lga_area.toProperCase() + " for medical services are from:");
  $("#CSVbtn").css('visibility','visible');
  selected_year = document.getElementById( "selectYear" ).value
  //
  getTravelOriginData(lga_area,selected_year);
  layer.bringToFront();
  layer.setStyle({
    color:'#555',
    weight:3,
    opacity:1

  });

}

  //Gets the origins of travel data;
  //Needs to pass the name of the LGA we are interested in to back end
  function getTravelOriginData(key_destination_lga, selected_year){
    var origins_json;
    $.getJSON('/get_travel_origins', {
          key_destination_lga: key_destination_lga,
          selected_year: selected_year
        },
      function(data){
        // Contains the response from the ajax call
        // in JSON format
        origin_choropleth_intensities = data;
        // Re-sets the colour scales based on the new data
        colorScale = chroma
          .scale(['#F0F0AF', '#e27474'])
          .domain([0,getMaxValue(origin_choropleth_intensities)],50,'log');

          total_commuters = getCommuterSum(origin_choropleth_intensities);

        // Updates the intensities of each LGA
        topoLayer.eachLayer(updateChoroColours_Origins);
        drawChart();
      }).fail(
        function(jqXHR, status, error){
          topoLayer.eachLayer(handleLayer);
          d3.select('.chart').selectAll('g').remove();
          bootbox.alert("There are no records of persons travelling to that area.");
          CLICKED = false; // Resets tooltip
        });


  }



// Loops over all LGA polygons and updates their colour based on the
// new values
function updateChoroColours_Origins(layer){
  var specific_lga_intensity = origin_choropleth_intensities[layer.feature.properties.vic_lga__3]

  // Defines the fill colour for this specific LGA area
  if (specific_lga_intensity == 0){
    fillColor = '#999999'
  } else {
  fillColor = colorScale(specific_lga_intensity).hex();
  }
  // Sets the fill colour for this specific layer
  layer.setStyle({
    fillColor : fillColor,
    fillOpacity: 0.8,

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


// Function calulates total travellers for LGA that is clicked on
function getCommuterSum(lga_counts){
  var sum = 0

  vectorised_lgas = []
  for(var i in lga_counts) {
        vectorised_lgas.push([i, lga_counts [i]])
      };

  for(var i in vectorised_lgas) {
        sum += vectorised_lgas[i][1]
      };
  return sum
}



// method that we will use to update the control based on feature properties passed
info.update = function (props) {
    //console.log(props.vic_lga__2);
    if (CLICKED == false){
    this._div.innerHTML = '<h4>Local Government Area</h4>' +  (props ?
        '<b>' + props.vic_lga__3.toProperCase()+ '</b>'
        : '<p> Hover over a LGA </p>');
      } else {
        this._div.innerHTML = '<h4>Local Government Area</h4>' +  (props ?
            '<b>' + props.vic_lga__3.toProperCase() + '</b>' + '</br>' + '<p>' + 'Count: '+ origin_choropleth_intensities[props.vic_lga__3] + '</br>' +
            'Percentage: ' + (origin_choropleth_intensities[props.vic_lga__3]/total_commuters * 100).toFixed(2) + '%' + '</p>'
            : '<p> Hover over a LGA </p>');
      }
};

info.addTo(mymap);

/*
****** D3 and the sidebar bar charts

*/

function getPieDataset(lga_counts){

vectorised_lgas = []
for(var i in lga_counts) {
      vectorised_lgas.push([i, lga_counts [i]])
    };
  ordered_lga_list =  vectorised_lgas.sort(function(a,b){return b[1] - a[1]})

result = []
for(var i in ordered_lga_list) {
  if (ordered_lga_list[i][1] == 0){
    break;
  } else if(i==4){
    var others = ordered_lga_list.slice(i,ordered_lga_list.length);
    var others_total = 0;
    for (j = 0; j < others.length; j++) {
      others_total += others[j][1];
    }
    result.push({ lga_name: "OTHERS", count: others_total});
    break;
  } else {
    result.push({lga_name: ordered_lga_list[i][0],
                    count: ordered_lga_list[i][1]})
  }
}
return result
}

function drawChart(){
        var dataset = getPieDataset(origin_choropleth_intensities)

        var margin = {top: 0, right: 0, bottom: 0, left: 18};
        var width = 328;
        var height = 540 - margin.top - margin.bottom;
        var radius = 120;

        var color = d3.scaleOrdinal()
        .range(['#b2182b','#ef8a62','#fddbc7','#d1e5f0','#2166ac']);
        var donutWidth = 40;

        var legendRectSize = 25;
        var legendSpacing = 4;

        // Delete any chart that was previously there
        d3.select('.chart').selectAll('g').remove();

        var svg = d3.select('.chart')
          .attr('width', width)
          .attr('height', height)
          .attr("align","center")
          .append('g')
          .attr('transform', 'translate(' + (width / 2 ) +
            ',' + (height -380 + margin.top) + ')');

        var arc = d3.arc()
        .innerRadius(radius - donutWidth)
        .outerRadius(radius);

        var pie = d3.pie()
          .value(function(d) { return d.count; })
          .sort(null);

        var path = svg.selectAll('path')
          .data(pie(dataset))
          .enter()
          .append('path')
          .attr('d', arc)
          .transition().delay(function(d, i) { return i * 0; }).duration(700)
          .attrTween('d', function(d) {
            var i = d3.interpolate(d.startAngle+0.1, d.endAngle);
            return function(t) {
            d.endAngle = i(t);
          return arc(d);
          }
          })
          .attr('fill', function(d) {
            return color(d.data.lga_name);
          });

            // Legend
          var legend = svg.selectAll('.legend')
            .data(color.domain())
            .enter()
            .append('g')
            .attr('class', 'legend')
            .attr('transform', function(d, i) {
              var height = legendRectSize + legendSpacing;
              var offset =  height * color.domain().length / 2;
              var horz = -2 * legendRectSize - 35;
              var vert = i * 1.5 *  height - offset + 240;
              return 'translate(' + horz + ',' + vert +  ')';
            });

          legend.append('rect')
            .attr('width', legendRectSize)
            .attr('height', legendRectSize)
            .style('fill', color)
            .style('stroke', color);

          legend.append('text')
            .attr('x', legendRectSize + legendSpacing + 25)
            .attr('y', legendRectSize - legendSpacing)
            .text(function(d) { return d; });
}(window.d3)



// CSV Exporting button
function downloadToCSV(){
  var x = new CSVExport(vectorised_lgas);
  return false;
}

document.getElementById( "selectYear" ).onchange = function() {
    var index = this.selectedIndex;
    var changed_year = this.children[index].value;
    getTravelOriginData(lga_area,changed_year);
}

String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};


/*
// Layer Groups
var choropleth_map = L.layerGroup(topoLayer);
var overlayMaps = {
    "Choropleth": choropleth_map
    "Commuter Origins": commuter_origins
};
L.control.layers(overlayMaps).addTo(mymap);


// Get the markers from json
*/

// Login modal handlers
$(document).ready(function(){


        $("#modal-login").click(function(){
          var username = document.getElementById('usrname').value
          var password = document.getElementById('psw').value
          if (username == 'kevin@geografia.com.au' && password == 'collinsstreet'){
          $("#myModal").modal("hide");
        }
        })

        $('#myModal').modal({
          backdrop: 'static',
          keyboard: false
        })
    });
