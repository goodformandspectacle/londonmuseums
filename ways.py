#!/usr/bin/env python
"""Walk overpass XML (result) and expand ways."""

__author__ = "siznax"
__date__ = "Jan 2015"

import argparse
import csv
import json
import os

from lxml import etree

OUTPUT = {}
OSM = 'http://www.openstreetmap.org'
FIELDNAMES = ['size', 'label', 'relation', 'way', ]


def get_relation(root, way_id):
    """returns relation id from way id, if applicable."""
    qry = "//relation/member[@type='way' and @ref='%s']" % way_id
    member = root.xpath(qry)
    if len(member):
        return member[0].getparent().get("id")


def get_way_label(way_elem, relation):
    """returns name tag value from way element, if present."""
    name_tag = way_elem.xpath(".//tag[@k='name']")
    if len(name_tag):
        return name_tag[0].get("v")
    return "(relation/%s)" % relation


def path_width(path):
    """returns greatest difference in longitude (east/west)"""
    lons = [abs(x[0]) for x in path]
    base = [lons[0]] * len(lons)
    diff = [abs(i - j) for i, j in zip(lons, base)]
    return max(diff)


def path_height(path):
    """returns greatest difference in latitude (north/south)"""
    lats = [abs(x[1]) for x in path]
    base = [lats[0]] * len(lats)
    diff = [abs(i - j) for i, j in zip(lats, base)]
    return max(diff)


def get_link(typ, val):
    """returns link to way or relation"""
    if val:
        return "%s/%s/%s" % (OSM, typ, val)


def walk_way_items(root, way_id):
    """prints details for each way path."""
    way = root.xpath("//way[@id='%s']" % way_id)[0]
    rel_id = get_relation(root, way_id)
    label = get_way_label(way, rel_id)
    coords = []
    nodes = []
    path = []
    scale = 1.0001
    for item in way:
        if item.tag == 'nd':
            nd_ref = item.get("ref")
            node = root.xpath("//node[@id='%s']" % nd_ref)[0]
            lat = float(node.get("lat"))
            lon = float(node.get("lon"))
            nodes.append(nd_ref)
            coords.append([lat, lon])
            path.append([scale*lon, scale*lat])
    size = "%f_%s" % ((path_width(path) + path_height(path)),
                      way_id)  # avoid collisions
    OUTPUT[size] = {'size': size, 'way': way_id, 'label': label,
                    'coords': coords, 'nodes': nodes,
                    'geo': {'type': 'LineString', 'coordinates': path},
                    'wlink': get_link('way', way_id),
                    'rlink': get_link('relation', rel_id)}


def write_csv(filename, output):
    fieldnames = ['size', 'way', 'label']
    with open(filename, 'w') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for item in reversed(sorted(output)):
            _size = output[item]['size'].split('_')[0]
            writer.writerow({'size': _size,
                             'way': output[item]['wlink'],
                             'label': output[item]['label']})
        return csvfile.tell()


def write_geojson(dest, output):
    if os.path.exists(dest):
        raise StandardError("destination file exists: %s" % dest)
    os.mkdir(dest)
    for szkey in output:
        name = output[szkey]['way'] + '.json'
        fname = os.path.join(os.getcwd(), dest, name)
        with open(fname, 'w') as jsfile:
            jsfile.write(json.dumps(output[szkey]['geo']))
            print "wrote %s bytes to %s" % (jsfile.tell(), fname)


def walk_ways(root):
    for way in root.xpath("//way"):
        walk_way_items(root, way.get("id"))


def main(_file, args):
    tree = etree.parse(_file)
    walk_ways(tree.getroot())
    if args.csvfile:
        nbytes = write_csv(args.csvfile, OUTPUT)
        print "wrote %s bytes to %s" % (nbytes, args.csvfile)
        return
    if args.json_dest:
        write_geojson(args.json_dest, OUTPUT)
        return
    for sizekey in reversed(sorted(OUTPUT)):
        if args.format == "list":
            print "%s %s %s" % (OUTPUT[sizekey]['size'].split('_')[0],
                                OUTPUT[sizekey]['wlink'],
                                OUTPUT[sizekey]['label'])
        if args.format == "dump":
            print OUTPUT[sizekey]
        if args.format == "geojson":
            print OUTPUT[sizekey]['geo']


if __name__ == "__main__":
    argp = argparse.ArgumentParser(
        description="Expand OSM ways and emit by size.")
    argp.add_argument("format", choices=['list', 'dump', 'geojson'])
    argp.add_argument('-csv', '--csvfile',
                      help="write CSV list to specified file.")
    argp.add_argument('-json', '--json-dest',
                      help="write GeoJSON files to specified directory.")
    args = argp.parse_args()
    main("overpass.xml", args)
