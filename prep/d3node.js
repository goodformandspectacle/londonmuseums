var fs = require('fs');
eval(fs.readFileSync('d3vectiles.js') + '');

var jsdom = require('jsdom');
jsdom.env(
    "<html><head></head><body></body></html>",
    ["http://d3js.org/d3.v3.min.js",
     "http://d3js.org/d3.geo.tile.v0.min.js"], function (err, window) {
         var width=960, height=500;
         var svg = window.d3.select("body")
             .append("svg")
             .attr("xmlns","http://www.w3.org/2000/svg")
             .attr("version","1.1")
             .attr("width", width).attr("height", height);

         var tiler = window.d3.geo.tile()
             .size([width, height]);

         var projection = window.d3.geo.mercator()
             .center(waypath_center)
             .scale((1 << 26) / 2 / Math.PI)
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
                 var url = "http://" + ["a", "b", "c"][(d[0] * 31 + d[1]) % 3] + ".tile.openstreetmap.us/vectiles-highroad/" + d[2] + "/" + d[0] + "/" + d[1] + ".json";
                 window.d3.json(url, function(error, json) {
                     g.selectAll("path")
                         .data(json.features.sort(function(a, b) { return a.properties.sort_key - b.properties.sort_key; }))
                         .enter().append("path")
                         .attr("class", function(d) { return d.properties.kind; })
                         .attr("style","fill:none; stroke:#ccc; stroke-linejoin:round; stroke-linecap:round;")
                         .attr("d", path);
                 });
             });

         svg.selectAll(".waypath").data([waypath])
             .enter().append("path")
             .attr("class","waypath")
             .attr("style","fill:none; stroke:orange; stroke-width:5; stroke-linejoin:round; stroke-linecap:round}")
             .attr("d",path);

         setTimeout(function(){
             console.log(window.d3.select("body").html());
         }, 10000);

     });
