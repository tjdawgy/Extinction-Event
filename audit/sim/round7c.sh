#!/bin/sh
# Phase 7c: one tuning round's screening runs (tri 8 per cell, gvg 20 per pairing, field 1 seed per side) with an experiment's code.
#   sh audit/sim/round7c.sh <tag> ["SIM code"]
T=$1; C=${2:-}
node audit/sim/stratrun.js --set=tri --n=4 --jobs=4 --tag=$T --code="$C" 2>/dev/null > audit/logs7c/tri-$T.txt
node audit/sim/stratrun.js --set=gvg --n=10 --jobs=4 --tag=$T --code="$C" 2>/dev/null > audit/logs7c/gvg-$T.txt
node audit/sim/stratrun.js --set=field --n=1 --jobs=4 --tag=$T --code="$C" 2>/dev/null > audit/logs7c/field-$T.txt
echo round $T done
