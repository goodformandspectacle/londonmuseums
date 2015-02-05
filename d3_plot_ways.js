var points = [
    { "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [-0.0993188,51.5074955]},
      "properties": { "name": "24642569	Tate Modern" }
    },
    { "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [-0.1276205,51.4911110]},
      "properties": { "name": "24553580 Tate Britain" }
    },
    { "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [-0.1085966,51.4957826]},
      "properties": { "name": "8614496 Imperial War Museum" }
    }];

var jsdom = require('jsdom');
jsdom.env(
    "<html><head></head><body></body></html>",
    ["http://d3js.org/d3.v3.min.js",
     "http://d3js.org/d3.geo.tile.v0.min.js"], function (err, window) {
         var width=1200, height=800;
         var zoom = 22;
         var center=[-0.0882,51.4898];
         var svg = window.d3.select("body")
             .append("svg")
             .attr("xmlns","http://www.w3.org/2000/svg")
             .attr("version","1.1")
             .attr("width", width).attr("height", height);

         var tiler = window.d3.geo.tile()
             .size([width, height]);

         var projection = window.d3.geo.mercator()
             .center(center)
             .scale((1 << zoom) / 2 / Math.PI)
             .translate([width / 2, height / 2]);

         var path = window.d3.geo.path()
             .projection(projection);

         svg.selectAll("g")
             .data(tiler
                   .scale(projection.scale() * 2 * Math.PI)
                   .translate(projection([0, 0])))
             .enter().append("g")
             .each(function(d) {
                 var g = window.d3.select(this);
                 var url = "http://" + ["a", "b", "c"][(d[0] * 31 + d[1]) % 3]
                     + ".tile.openstreetmap.us/vectiles-water-areas/" + d[2]
                     + "/" + d[0] + "/" + d[1] + ".json";
                 window.d3.json(url, function(error, json) {
                     g.selectAll("path")
                         .data(json.features.sort(function(a, b) {
                             return a.properties.sort_key - b.properties.sort_key;}))
                         .enter().append("path")
                         .attr("class", function(d) { return d.properties.kind; })
                         .attr("style", "fill:lightblue;stroke:lightblue;"
                               + "stroke-width:1;stroke-linejoin:round;"
                               + "stroke-linecap:round")
                         .attr("d", path);
                 });
             });

         // add labels, see http://bost.ocks.org/mike/map/
         svg.selectAll(".place-label").data(points)
             .enter().append("text")
             .attr("class","place-label")
             .attr("transform", function(d) {
                 return "translate(" + projection(d.geometry.coordinates) + ")";
             })
             .attr("dy", "1em")
             .text(function(d) {
                 return d.properties.name;
             });

         // style labels
         svg.selectAll(".place-label")
             .style("font-family", "sans-serif");
             // .style("baseline-shift", "-0.8em");

         // add center points
         svg.selectAll("c").data(points)
             .enter().append("path")
             .attr("class","center")
             .attr("style","fill:orange")
             .attr("d",path);

         setTimeout(function(){
             console.log(window.d3.select("body").html());
         }, 1000);

     });
