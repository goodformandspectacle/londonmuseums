Way (footprint) Shapes
======================

Here's a complex example. There are only three of these (relations),
the rest are "simple" ways or closed polygons (I believe). 

    Museum of London
    Relation: [2711501](http://www.openstreetmap.org/relation/2711501)
    Members:
        Way 201846173 as inner
        Way 156190525 as outer
        Way 201846172 as inner

Way [201846173](http://www.openstreetmap.org/way/201846173) as inner:

```xml
<way id="201846173">
   <nd ref="2118622485"/>
   <nd ref="2118622493"/>
   <nd ref="2118622492"/>
   <nd ref="2118622491"/>
   <nd ref="1684710412"/>
   <nd ref="2118622485"/>
</way>
```

Expanded (inner) way, this is a shape:

    rel     way       node       lat        lon
    2711501 201846173 2118622485 51.5178609 -0.0958974
    2711501 201846173 2118622493 51.5181042 -0.0957513
    2711501 201846173 2118622492 51.5180426 -0.0954863
    2711501 201846173 2118622491 51.5179722 -0.0955286
    2711501 201846173 1684710412 51.5177974 -0.0956264
    2711501 201846173 2118622485 51.5178609 -0.0958974

This could be a starting point to draw an SVG image.

Some interesting shapes:

<http://www.openstreetmap.org/relation/2711501> Museum of London   
<http://www.openstreetmap.org/way/115594423> Leighton House Museum    
<http://www.openstreetmap.org/way/146412246> Brunel Museum    
<http://www.openstreetmap.org/way/148707730> Honeywood House    
<http://www.openstreetmap.org/way/182395637> Ragged School Museum    
<http://www.openstreetmap.org/way/183090506> National Maritime Museum    
<http://www.openstreetmap.org/way/246300057> Brooklands Museum    
<http://www.openstreetmap.org/way/268533442> Astronomy Centre    
<http://www.openstreetmap.org/way/40405915 British Museum    
<http://www.openstreetmap.org/way/95809105 Chiltern Open Air Museum    


OSM Overpass Query
================================================================

Overpass query for relations, ways, and nodes found:

       3 relation  (comp
      98 way
    1381 node

Collected counts similar to parsing Wikipedia article (below):

  "count": {
    "geo": 180, 
    "loc": 7, 
    "museum": 175, 
    "osm": 180, 
    "way": 95, 
    "web": 20, 
    "wiki": 16 }

Relations:

    relation:29795 name:"Victoria &amp; Albert Museum"
    relation:1912113 name:"The Florence Nightingale Museum"
    relation:2711501 name:"Museum of London"

Found (87) different tag keys:

    80 tag k="tourism"
    73 tag k="name"
    87 tag k="building"
    47 tag k="wikipedia"
    45 tag k="website"
    32 tag k="wheelchair"
    32 tag k="source"
    26 tag k="addr:street"
    23 tag k="entrance"
    23 tag k="addr:postcode"
    ...


Parse List of Museums in London, Wikipedia
========================================================

Parsed <http://en.wikipedia.org/wiki/List_of_museums_in_London>

Found (223) entries (as of 4 Aug 2014) with:

    count": {
       "geo": 223,
       "loc": 108,
       "museum": 240,
       "osm": 223,
       "web": 120,
       "wiki": 240 }


Where, for example:

    "data": [
        {
	    "geo": "51.496667; -0.171944",
            "loc": "Cromwell Gardens, South Kensington, London, United Kingdom",
            "museum": "Victoria and Albert Museum",
            "osm": "http://www.openstreetmap.org/#map=17/51.496667/-0.171944",
            "web": "http://www.vam.ac.uk/",
            "wiki": "http://wikipedia.org/wiki/Victoria_and_Albert_Museum" }, ... ]

@siznax
