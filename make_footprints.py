#!/usr/bin/env python

__author__ = "siznax"
__date__ = "Feb 2015"

import csv
import os
import subprocess


def write(output, outfile):
    with open(outfile, "wb") as _outfile:
        _outfile.write(output)
        print "wrote %d bytes to %s" % (_outfile.tell(), outfile)


def process(row):
    pwd = os.getcwd()
    label = "".join([c for c in row['label'] if c.isalnum()])
    infile = "svgdata/%s.json" % row['way']
    outfile = "svg/%s-%s.svg" % (row['way'], label)
    cmdfile = "d3_make_way.js"
    cmd = os.path.join(pwd, cmdfile)

    if os.path.exists(outfile):
        print "file exists: %s" % outfile
        return

    print "%s %s > %s" % (cmdfile, infile, outfile)
    output = subprocess.check_output("%s %s" % (cmd, infile), shell=True)
    write(output, outfile)


def main(csvfile):
    with open(csvfile, 'rb') as _file:
        for row in csv.DictReader(_file):
            if row['center']:
                process(row)


if __name__ == "__main__":
    main("overpass_center_ways.csv")
