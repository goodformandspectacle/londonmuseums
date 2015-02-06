NOTES
=====

Most recent progress up top!  :grin:

Making Ways SVGs
----------------

The script <tt>extract_ways.py</tt> can output SVG data for each
waypath suitable for input to <tt>d3_make_way.js</tt> for making an
individual museum's waypath SVG. For example, Tate Britain
(way/24553580):

```shell
$ ./extract_ways.py overpass_center.xml svg -svg svgdata
$ ./d3_make_way.js geojson/24553580.json > d3_make_way.svg
```

We now have an example map with a few museum centerpoints plotted and
labeled against a recognizable water feature
([d3_plot_ways.svg](https://github.com/goodformandspectacle/londonmuseums/blob/master/d3_plot_ways.svg))
and an example footprint (way) SVG with a matching centerpoint
([d3_make_way.svg](https://github.com/goodformandspectacle/londonmuseums/blob/master/d3_make_way.svg)). 

For some reason, place-labels (text) don't show up in the GitHub SVG
preview, so you'll want to pull from the repo and open it in your
favorite viewer.


Example vs. Center Overpass Output
----------------------------------

The <tt>overpass_center</tt> result produced by the "Greater London"
bounding box differed from the <tt>overpass_example</tt> output thus:

```
appearing only in overpass_CENTER_ways:
    203708843 HMS Belfast ticket office
    306698053 The Cinema Museum
    37909715 (relation/177044)
    40405915 (relation/177044)

appearing only in overpass_EXAMPLE_ways:
    140327400 Egham Museum
    149913507 Otford Heritage Centre
    187420538 (relation/None)
    194923622 Eton Natural History Museum
    203708843 HMS Belfast
    208429132 Weybridge Library and Elmbridge Museum
    246300057 Brooklands Museum
    255871351 Quebec House
    40405915 British Museum
    43917586 Dartford Borough Museum and Library
    95809105 Chiltern Open Air Museum
```

Here's (roughly) how the difference was computed:

```shell
$ cut -d ' ' -f 2- overpass_*_ways.txt | sort | uniq -c\
  | sort | grep '^   1' | cut -d ' ' -f 5- >overpass_ways.diff
$ while read line;
  do grep "$line" overpass_center_ways.txt;
  done <overpass_ways.diff
$ while read line;
  do grep "$line" overpass_example_ways.txt;
  done <overpass_ways.diff
```


Got Ways Centerpoints
---------------------

The [Overpass turbo](http://overpass-turbo.eu/) Wizard was used to
generate a query for <tt>“tourism=museum in "Greater London"”</tt>,
then modified it to print centerpoints (see 
<tt>overpass_center_query.txt</tt>): 

```
// print results
out center;
```

The output format was changed to XML (<tt>out:xml</tt>) and the "raw
data" was exported to process in the same way as the
<tt>overpass_example.xml</tt>. The raw XML was not checked in to avoid
bloating this repo any further.

* Extracted "center" ways with <tt>extract_ways.py</tt>
* Output to: [overpass_center_ways.csv](https://github.com/goodformandspectacle/londonmuseums/blob/master/overpass_center_ways.csv)

```shell
$ ./extract_ways.py overpass_center.xml list -csv overpass_center_ways.csv
```


Plotted Largest (25) Ways
-------------------------

GeoJSON for each way can be extracted directly from an Overpass XML
result using <tt>extract_ways.py list --json dest</tt>. You can also
just adjust the query to export GeoJSON directly. The biggest 25
ways were plotted on a large D3 tile, just to get oriented, using
<tt>d3_plot_ways.js</tt>, see
[d3_plot_ways.svg](https://github.com/goodformandspectacle/londonmuseums/blob/master/d3_plot_ways.svg). 

This produces an interesting image with very small footprints, but it
shows that we can accurately place undistorted footprints on a flat
map. 

So, we'll continue down the path of getting centerpoints for each way
so that we can generate scalable graphics for each one, and paint
targets on a large image to place them accurately.

Winning!


Computed "size" of Ways
-----------------------

A size was computed for each _way_ by adding together the maximum
difference in lat and lon for each point in the path. It seems like
a reasonable sort.

* Added size computation to: <tt>extract_ways.py</tt>
* Sorted by size into: [overpass_example_ways.csv](https://github.com/goodformandspectacle/londonmuseums/blob/master/overpass_example_ways.csv)

The largest 25 ways were plotted on D3 vector tiles and they're
tiny. It doesn't make sense to try to scale them as lat/lon ways, so
we'll need to generate SVGs for each path from their respective
centerpoints. 


D3 Vector Tiles
---------------

If we express our way coordinates in GeoJSON format, we can use use D3
map projection tiles to draw the shape as an SVG path without
distortion. 

* Added "--geojson" arg to <tt>extract_ways.py</tt>
* Altered D3 Vector Tiles example: <tt>d3vectiles.html</tt>
* Example GeoJSON: <tt>d3vectiles.js</tt>, <tt>d3vectiles.css</tt>
* SVG capture from example: <tt>d3vectiles.png</tt> looks like
  [relation 2711501](http://www.openstreetmap.org/relation/2711501)

If we can query OSM for the "center" coordinate of each shape, I think
we can produce similar SVGs in a Node.js script...

* Example node script: <tt>d3node.js</tt>
* Output: <tt>d3node.svg</tt>


Generated Way Vector Shapes
---------------------------

* Extracted ways with <tt>extract_ways.py</tt>
* Compact list: <tt>overpass_example_ways.txt</tt>

Here's a complex example. There are only three of these (relations),
the rest are "simple" ways or closed polygons. 

Relation: [2711501](http://www.openstreetmap.org/relation/2711501)

    Name: Museum of London
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

* http://www.openstreetmap.org/relation/2711501 Museum of London
* http://www.openstreetmap.org/way/115594423 Leighton House Museum
* http://www.openstreetmap.org/way/146412246 Brunel Museum
* http://www.openstreetmap.org/way/148707730 Honeywood House
* http://www.openstreetmap.org/way/182395637 Ragged School Museum
* http://www.openstreetmap.org/way/183090506 National Maritime Museum
* http://www.openstreetmap.org/way/246300057 Brooklands Museum
* http://www.openstreetmap.org/way/268533442 Astronomy Centre   
* http://www.openstreetmap.org/way/40405915 British Museum 
* http://www.openstreetmap.org/way/95809105 Chiltern Open Air Museum



OSM Overpass Query
------------------

* Overpass query: <tt>overpass_example_query.txt</tt>
* Query output: <tt>overpass_example.xml</tt>
* Parsed with: <tt>parse_overpass_xml.py</tt>
* Collected output: <tt>parse_overpass_xml.json</tt>

Overpass query for relations, ways, and nodes found:

       3 relation (have ways as members)
      98 way      (polygons)
    1381 node     (points in lat, lon)

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
------------------------------------------

* Source: <http://en.wikipedia.org/wiki/List_of_museums_in_London>
* Parsed with <tt>parse_wp_list.py</tt>
* Output: <tt>parse_wp_list.json</tt>

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
