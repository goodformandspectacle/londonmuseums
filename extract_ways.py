#!/usr/bin/env python
"""Walk OSM XML and expand ways."""

__author__ = "siznax"
__date__ = "Jan 2015"

import argparse
import csv
import json
import os

from lxml import etree

OUTPUT = {}
OSM = 'http://www.openstreetmap.org'
FIELDNAMES = ['size', 'center', 'way', 'label']


def get_relation(root, way_id):
    """returns relation id from way id, if applicable."""
    qry = "//relation/member[@type='way' and @ref='%s']" % way_id
    member = root.xpath(qry)
    if len(member):
        return member[0].getparent().get("id")


def get_center_coords(way_elem):
    """return center coords of way"""
    coords = way_elem.xpath(".//center")
    if len(coords):
        return [float(coords[0].get("lat")),
                float(coords[0].get("lon"))]


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

def svg_data(way, path, label, center, size):
    """returns GeoJSON suitable for creating SVG"""
    if center:
        svg_center = [center[1], center[0]]  # *shakes fist at sky*
    else:
        svg_center = None
    return {"type": "Feature",
            "geometry": {"type": "LineString",
                         "coordinates": path},
            "properties": {"way": way,
                           "name": label,
                           "center": svg_center,
                           "size": size}}

def walk_way_items(root, way_id):
    """prints details for each way path."""
    way = root.xpath("//way[@id='%s']" % way_id)[0]
    rel_id = get_relation(root, way_id)
    label = get_way_label(way, rel_id)
    center = get_center_coords(way)
    coords = []
    nodes = []
    path = []
    for item in way:
        if item.tag == 'nd':
            nd_ref = item.get("ref")
            node = root.xpath("//node[@id='%s']" % nd_ref)[0]
            lat = float(node.get("lat"))
            lon = float(node.get("lon"))
            nodes.append(nd_ref)
            coords.append([lat, lon])
            path.append([lon, lat])
    size = "%f_%s" % ((path_width(path) + path_height(path)),
                      way_id)  # avoid collisions
    OUTPUT[size] = {'size': size, 'way': way_id, 'label': label,
                    'center': "%f/%f" % (center[0], center[1]) if center else None,
                    'coords': coords, 'nodes': nodes,
                    'svgdata': svg_data(
                        way_id, path, label, center,
                        float(size.split('_')[0])), 
                    'wlink': get_link('way', way_id),
                    'rlink': get_link('relation', rel_id)}


def write_csv(filename, output):
    with open(filename, 'w') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=FIELDNAMES)
        writer.writeheader()
        for item in reversed(sorted(output)):
            _size = output[item]['size'].split('_')[0]
            writer.writerow({'size': _size,
                             'center': output[item]['center'],
                             'way': output[item]['way'],
                             'label': output[item]['label']})
        return csvfile.tell()


def write_svgdata(dest, output):
    if os.path.exists(dest):
        raise StandardError("destination file exists: %s" % dest)
    os.mkdir(dest)
    for szkey in output:
        name = output[szkey]['way'] + '.json'
        fname = os.path.join(os.getcwd(), dest, name)
        with open(fname, 'w') as jsfile:
            jsfile.write(json.dumps(output[szkey]['svgdata']))
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
    if args.data_dest:
        write_svgdata(args.data_dest, OUTPUT)
        return
    if args.format == "list":
        print " | ".join(FIELDNAMES)
    for sizekey in reversed(sorted(OUTPUT)):
        if args.format == "list":
            print "%s %s %s %s" % (OUTPUT[sizekey]['size'].split('_')[0],
                                   OUTPUT[sizekey]['center'],
                                   OUTPUT[sizekey]['way'],
                                   OUTPUT[sizekey]['label'])
        if args.format == "dump":
            print OUTPUT[sizekey]
        if args.format == "svg":
            print OUTPUT[sizekey]['svgdata']


if __name__ == "__main__":
    argp = argparse.ArgumentParser(
        description="Extract ways from OSM XML and emit by size.")
    argp.add_argument("overpass_xml", help="Overpass API XML output")
    argp.add_argument("format", choices=['list', 'dump', 'svg'],
                      help="output format")
    argp.add_argument('-csv', '--csvfile',
                      help="write CSV list to specified file.")
    argp.add_argument('-svg', '--data-dest',
                      help="write SVG data files to specified directory.")
    args = argp.parse_args()
    main(args.overpass_xml, args)
