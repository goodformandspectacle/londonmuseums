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
  
  def select(self, doc, selector):
    """CSS select elements from documnet"""
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

    selectors = {"lat": ".latitude",
                 "lon": ".longitude",
                 "geo": ".geo"}
    for key, sel in selectors.iteritems():
      try:
        dat[key] = self.select(doc, sel)[0].text
      except:
        dat[key] = None

    infobox = doc.cssselect('.infobox')
    if infobox:
      for elm in infobox[0]:
        location = get_location(elm)
        if location:
          dat['loc'] = location
        website = get_website(elm)
        if website:
          dat['web'] = website

    return dat

def get_website(elm):
  if 'Website' in elm.text_content():
    for item in elm.iterlinks():
      return item[2]

def get_location(elm):
  if ('Address' in elm.text_content() or 'Location' in elm.text_content()):
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
