#!/usr/bin/env python
"""
Generate footprint SVGs from Overpass CSV and JSON data.

Dependencies:
    extract_ways.py
        => overpass.csv    [ way | center | label ]
        => svgdata/*.json  { "center", "geometry", "size" }
    make_way.js
"""

__author__ = "siznax"
__date__ = "Feb 2015"

import argparse
import csv
import os
import subprocess

MAKEWAYCMD = "make_way.js"


def write(output, outfile):
    with open(outfile, "wb") as _outfile:
        _outfile.write(output)
        print "wrote %d bytes to %s" % (_outfile.tell(), outfile)


def process(row, svgdata, svgdest):
    pwd = os.getcwd()
    label = "".join([c for c in row['label'] if c.isalnum()])
    infile = "%s/%s.json" % (svgdata, row['way'])
    outfile = "%s/%s-%s.svg" % (svgdest, row['way'], label)
    cmdfile = MAKEWAYCMD
    cmd = os.path.join(pwd, cmdfile)

    if os.path.exists(outfile):
        print "file exists: %s" % outfile
        return

    print "%s %s > %s" % (cmdfile, infile, outfile)
    output = subprocess.check_output("%s %s" % (cmd, infile), shell=True)
    write(output, outfile)


def main(csvfile, svgdata, svgdest):
    if not os.path.exists(svgdata):
        raise StandardError("data dir does not exist: %s" % svgdata)
    if os.path.exists(svgdest):
        raise StandardError("dest dir exists: %s" % svgdest)
    else:
        os.mkdir(svgdest)
    with open(csvfile, 'rb') as _file:
        for row in csv.DictReader(_file):
            if row['center']:
                process(row, svgdata, svgdest)


if __name__ == "__main__":
    desc = "Write ann SVG file foreach svgdata input found"
    argp = argparse.ArgumentParser(description=desc)
    argp.add_argument("csv",
                      help="Overpass CSV (from extract_ways)")
    argp.add_argument("data",
                      help="SVG input data directory (from extract_ways)")
    argp.add_argument("dest",
                      help="SVG destination directory")
    args = argp.parse_args()

    main(args.csv, args.data, args.dest)
