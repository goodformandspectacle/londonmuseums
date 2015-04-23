$.ajaxSetup({
async: false
});

var geojson = $.getJSON("/terraformer/data/overpass_center.geojson");

var featurecollection = new Terraformer.FeatureCollection({
  "type": geojson.responseJSON.type,
  "features": geojson.responseJSON.features
});