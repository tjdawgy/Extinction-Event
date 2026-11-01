#!/bin/sh
# Phase 7c: the final measurements on the numbers in index.html (24 matches per cell or more).
node audit/sim/stratrun.js --set=tri --n=12 --jobs=4 --tag=final 2>/dev/null > audit/logs7c/final-tri.txt
node audit/sim/stratrun.js --set=gvg --n=12 --jobs=4 --tag=final 2>/dev/null > audit/logs7c/final-gvg.txt
node audit/sim/stratrun.js --set=field --n=1 --jobs=4 --tag=final 2>/dev/null > audit/logs7c/final-field.txt
node audit/sim/stratrun.js --set=contain --n=12 --jobs=4 --tag=final 2>/dev/null > audit/logs7c/final-contain.txt
node audit/sim/stratrun.js --set=nodes --n=12 --jobs=4 --tag=final 2>/dev/null > audit/logs7c/final-nodes.txt
node audit/sim/validate7c.js --only=g,d,h,s,x,k 2>/dev/null > audit/logs7c/final-validate-hard.txt
node audit/sim/validate7c.js --only=e,r 2>/dev/null > audit/logs7c/final-validate-easynormal.txt
echo final done
