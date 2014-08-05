#!/usr/bin/env python2.7

__author__ = "@siznax"
__version__ = "Aug 2014"

import argparse
import json
import lxml.etree

from collections import defaultdict

OSM_BASE = 'http://www.openstreetmap.org'


class CollectorTarget(object):
    def __init__(self):
        self.events = []
        self.count = defaultdict(int)

    def start(self, tag, attrib):
        self.events.append("start <%s> attrs: %r" % (tag, dict(attrib)))
        self.count[tag] += 1
        for attr in attrib:
          self.count["tag." + attr] += 1

    def end(self, tag):
        self.events.append("end </%s>" % tag)

    def data(self, data):
        self.events.append("data %r" % data)

    def comment(self, text):
        self.events.append("comment %s" % text)

    def close(self):
        self.events.append("close")
        return "closed!"


def collect(infile):
  """collect tags"""
  parser = lxml.etree.XMLParser(target=CollectorTarget())
  with open(infile) as fp:
    lxml.etree.XML(fp.read(), parser)
    # for event in parser.target.events:
    #   print event
  return parser.target.count


def parse(infile, xpaths):
  """parse out selected xpaths"""
  dat = defaultdict(int)
  with open(infile) as fp:
    doc = lxml.etree.fromstring(fp.read())
    for path in xpaths:
      res = doc.xpath(path)
      dat[path] = len(res)
  return dat


class OverPassData:

  def __init__(self, infile):
    self.infile = infile
    self.data = []
    self.nodes = self.get_nodes()
    self.find_museums()
    self.find_ways()

  def get_nodes(self):
    """store nodes for lookup"""
    xpath = "//node"
    nodes = {}
    with open(self.infile) as fp:
      doc = lxml.etree.fromstring(fp.read())
      for node in doc.xpath(xpath):
        nodes[node.get("id")] = {"lat": node.get("lat"),
                                 "lon": node.get("lon")}
    return nodes

  def find_museums(self):
    """find museum nodes"""
    xpath = "//node/tag[@v='museum']"
    with open(self.infile) as fp:
      doc = lxml.etree.fromstring(fp.read())
      res = doc.xpath(xpath)
      for item in res:
        datum = defaultdict(str)
        lat = item.getparent().get('lat')
        lon = item.getparent().get('lon')
        datum["geo"] = "%s; %s" % (lat, lon)
        datum["osm"] = "%s/node/%s" % (OSM_BASE, item.getparent().get("id"))
        for sib in item.getparent().iterchildren():
          key = sib.get("k")
          val = sib.get("v")
          if 'addr' in key:
            datum["loc"] += " " + val
          if key == 'name':
            datum["museum"] = val
          if key == 'website':
            datum["web"] = val
          if key == 'wikipedia':
            datum["wiki"] = val
        self.data.append(datum)

  def find_ways(self):
    """find museum way tags and match to museum nodes"""
    xpath = "//way/tag[@v='museum']"
    with open(self.infile) as fp:
      doc = lxml.etree.fromstring(fp.read())
      res = doc.xpath(xpath)
      for item in res:
        datum = {}
        datum["way"] = item.getparent().get("id")
        ref = self.way_node_ref(item.getparent())
        node = self.nodes[ref]
        datum["geo"] = "%s; %s" % (node["lat"], node["lon"])
        datum["osm"] = "%s/way/%s" % (OSM_BASE, datum["way"])
        datum["museum"] = self.way_name(item.getparent())
        self.data.append(datum)

  def way_node_ref(self, elem):
    for child in elem.iterchildren():
      return child.get("ref")

  def way_name(self, elem):
    for child in elem.iterchildren():
      if child.get("k") == 'name':
        return child.get("v")

  def count(self):
    ctr = defaultdict(int)
    for item in self.data:
      for key in item:
        ctr[key] += 1
    return ctr


def main(args):
  xpaths = ["//*", "//@lat", "//@lon", "//nd",
            "//node", "//node/tag", "//node[@lat]", "//node[@lon]",
            "//node/tag[@k='tourism' and @v='museum']",
            "//relation", "//relation/tag",
            "//tag", "//tag[@v='museum']", "//tag[@k='name']",
            "//tag[@k='building' and @v='museum']",
            "//tag[@k='tourism' and @v='museum']",
            "//way", "//way/nd", "//way/tag"]
  opd = OverPassData(args.infile)
  data = {'collected': collect(args.infile),
          'parsed': parse(args.infile, xpaths),
          'data': opd.data,
          'count': opd.count()}
  print json.dumps(data, indent=2, sort_keys=True)


if __name__ == "__main__":
  argp = argparse.ArgumentParser()
  argp.add_argument("infile", metavar='xml_file', help="overpass XML file")
  main(argp.parse_args())
