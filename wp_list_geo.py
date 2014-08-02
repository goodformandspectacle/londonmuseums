#!/usr/bin/env python2.7

__author__ = "@siznax"
__version__ = "31 Jul 2014"

import argparse
import json
import logging
import lxml.html
import os
import requests
import sys

USER_AGENT = "goodformandspectacle/wp_list_geo"
BASE_HREF = 'http://wikipedia.org'
OSM_BASE = 'http://www.openstreetmap.org'
OSM_ZOOM = 17

class WPListGeoData:
  """crawl a Wikipedia list, fetching parsing children for geo data"""

  def __init__(self, debug=False, limit=None):
    lgr = logging.getLogger(USER_AGENT)
    if debug:
      lgr.setLevel(logging.DEBUG)
    else:
      lgr.setLevel(logging.ERROR)
    fmt = logging.Formatter('%(levelname)s: %(message)s')
    clog = logging.StreamHandler(sys.stdout)
    clog.setLevel(logging.DEBUG)
    clog.setFormatter(fmt)
    lgr.addHandler(clog)
    self.log = lgr
    self.data = []
    self.limit = limit

  def fetch(self, url, _file="seed.html"):
    """write HTML to file from URL if not extant"""
    if not os.path.exists(_file):
      self.log.info("fetching %s" % url)
      r = requests.get(url)
      with open(_file, 'w') as fp:
        fp.write(r.text.encode('utf-8'))
        self.log.info("wrote %d bytes to %s" % (fp.tell(), _file))
  
  def parse(self, _file="seed.html"):
    """parse lxml document from file"""
    self.log.info("parsing %s" % _file)
    with open(_file, 'r') as fp:
      return lxml.html.fromstring(fp.read())
  
  def get_geo(self, doc, dat):
    selectors = {"lat": ".latitude",
                 "lon": ".longitude",
                 "geo": ".geo"}
    for key, sel in selectors.iteritems():
      val = self.select(doc, sel)
      if val:
        dat[key] = val[0].text

  def select(self, doc, selector):
    """CSS select elements from document"""
    self.log.info("selecting %s" % selector)
    return doc.cssselect(selector)

  def hop(self, ind, elm):
    """fetch and parse one hop away"""
    dat = {}
    dat["museum"] = elm.text
  
    href = BASE_HREF + elm.attrib['href']
    dat["wiki"] = href
  
    html = "{0:03d}.html".format(ind)
    self.fetch(href, html)
    doc = self.parse(html)
    self.get_geo(doc, dat)

    add_osm(dat)
    poke_infobox(doc, dat)
    walk_links(doc, dat)

    return dat

def add_osm(dat):
  if 'geo' in dat:
    geo = dat['geo'].split('; ')
    dat['osm'] = "%s/#map=%s/%s/%s" % (OSM_BASE, OSM_ZOOM, geo[0], geo[1])

def walk_links(doc, dat):
  for item in doc.iterlinks():
    text = item[0].text_content().lower()
    if 'web' not in dat and 'official website' in text:
      dat['web'] = item[2]

def poke_infobox(doc, dat):
  infobox = doc.cssselect('.infobox')
  if infobox:
    for elm in infobox[0]:
      location = get_location(elm)
      if location:
        dat['loc'] = location
      website = get_website(elm)
      if website:
        dat['web'] = website

def get_website(elm):
  if 'website' in elm.text_content().lower():
    for item in elm.iterlinks():
      return item[2]

def get_location(elm):
  text = elm.text_content().lower()
  if 'address' in text or 'location' in text:
    loc = elm.text_content()
    loc = loc.replace("Address", '')
    loc = loc.replace("Location", '')
    return loc.strip()


def main(args):
  lgd = WPListGeoData(args.debug, args.limit)
  lgd.fetch(args.seed)
  for ind, elm in enumerate(lgd.select(lgd.parse(), args.CSS)):
    if lgd.limit and ind >= lgd.limit:
      break
    lgd.data.append(lgd.hop(ind, elm))
  print json.dumps(lgd.data, indent=2, sort_keys=True)


if __name__ == "__main__":
  epi = ("e.g.", 
         'http://en.wikipedia.org/wiki/List_of_museums_in_London',
         "'.wikitable tr th a'")
  argp = argparse.ArgumentParser(epilog=" ".join(epi))
  argp.add_argument("seed", help="Wikipedia list URL")
  argp.add_argument("CSS", help="CSS selector")
  argp.add_argument("-debug", action='store_true', default=False, 
                    help="debug flag")
  argp.add_argument("--limit", type=int, help="hop limit")

  main(argp.parse_args())
