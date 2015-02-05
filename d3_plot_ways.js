// add "biggest" 25 ways
var ways = [
    'geojson/95809105.json',
    'geojson/246300057.json',
    'geojson/118906069.json',
    'geojson/183090507.json',
    'geojson/24436446.json',
    'geojson/5095245.json',
    'geojson/27765411.json',
    'geojson/4960173.json',
    'geojson/40405915.json',
    'geojson/24553580.json',
    'geojson/132133793.json',
    'geojson/24642569.json',
    'geojson/118906074.json',
    'geojson/4417253.json',
    'geojson/156190525.json',
    'geojson/43634102.json',
    'geojson/118906073.json',
    'geojson/183090506.json',
    'geojson/8614496.json',
    'geojson/9558984.json',
    'geojson/103143319.json',
    'geojson/82785023.json',
    'geojson/24436380.json',
    'geojson/210442848.json'
];
var fs = require('fs');
var waypaths = Array();
for(var i = 0; i < ways.length; i++) {
    waypaths[i] = JSON.parse(fs.readFileSync(ways[i], 'utf8'));
}

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
                 var url = "http://" + ["a", "b", "c"][(d[0] * 31 + d[1]) % 3] + ".tile.openstreetmap.us/vectiles-water-areas/" + d[2] + "/" + d[0] + "/" + d[1] + ".json";
                 window.d3.json(url, function(error, json) {
                     g.selectAll("path")
                         .data(json.features.sort(function(a, b) { return a.properties.sort_key - b.properties.sort_key; }))
                         .enter().append("path")
                         .attr("class", function(d) { return d.properties.kind; })
                         .attr("style", "fill:lightblue;stroke:lightblue;stroke-width:1;stroke-linejoin:round;stroke-linecap:round")
                         .attr("d", path);
                 });
             });

         for(var i = 0; i < ways.length; i++) {
             svg.selectAll("w").data([waypaths[i]])
                 .enter().append("path")
                 .attr("class","waypath")
                 .attr("style","fill:orange;stroke:darkorange;}")
                 .attr("d",path);
         }

         setTimeout(function(){
             console.log(window.d3.select("body").html());
         }, 10000);

     });
