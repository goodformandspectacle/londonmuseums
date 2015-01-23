#!/usr/bin/env python
"""Walk overpass XML (result) and expand ways."""

__author__ = "siznax"
__date__ = "Jan 2015"

import argparse

from lxml import etree

COMPACT = []
FULL = []
OSM = 'http://www.openstreetmap.org'

def get_relation(root, way_id):
    """returns relation id from way id, if applicable."""
    qry = "//relation/member[@type='way' and @ref='%s']" % way_id
    member = root.xpath(qry)
    if len(member):
        return member[0].getparent().get("id")
    return "relation"

def get_way_name(way_elem):
    """returns name tag value from way element, if present."""
    name_tag = way_elem.xpath(".//tag[@k='name']")
    if len(name_tag):
        return name_tag[0].get("v")

def walk_way_items(root, way_id):
    """prints details for each way path."""
    relation = get_relation(root, way_id)
    way = root.xpath("//way[@id='%s']" % way_id)[0]
    name = get_way_name(way)
    if not name:
        name = "(%s/relation/%s)" % (OSM, relation)
    COMPACT.append("%s/way/%s %s" % (OSM, way_id, name))
    FULL.append("-- %s/way/%s %s" % (OSM, way_id, name))
    for item in way:
        if item.tag == 'nd':
            nd_ref = item.get("ref")
            node = root.xpath("//node[@id='%s']" % nd_ref)[0]
            lat = node.get("lat")
            lon = node.get("lon")
            row = " ".join([relation, way_id, nd_ref, lat, lon])
            FULL.append(row)


def walk_ways(root):
    for way in root.xpath("//way"):
        walk_way_items(root, way.get("id"))


def main(_file, args):
    tree = etree.parse(_file)
    root = tree.getroot()
    walk_ways(root)
    if args.compact:
        print "\n".join(COMPACT)
        return
    print "rel way node lat lon"
    print "\n".join(FULL)


if __name__ == "__main__":
    argp = argparse.ArgumentParser(description="Expand OSM ways.")
    argp.add_argument("-c", "--compact", action="store_true",
                      help="show compact list")
    args = argp.parse_args()
    main("overpass.xml", args)
