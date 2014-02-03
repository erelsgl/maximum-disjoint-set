/**
 * Select points at random, and calculate the size of the maximum disjoint set of squares touching them.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-01
 */
var seed = require('seed-random');
seed('foo', {global: true});//over-ride global Math.random

var EXPERIMENT_COUNT=10000;
var POINT_COUNT=12; // 6:2 7:2 8:3 9:3 10:9 11:5 12:5
var X_RANGE = Y_RANGE = 400;
var GRID_SIZE = 10;

var maximumDisjointSet = require("../shared/maximum-disjoint-set");
var makeXYUnique = require("../shared/make-xy-unique");
var squaresTouchingPoints = require("../shared/squares-touching-points");

function randomPointSnappedToGrid(maxVal, gridSize) {
	return 	Math.floor(Math.random()*maxVal/gridSize)*gridSize;
}

function randomPoints(count, xmax, ymax, gridSize) {
	var points = [];
	for (var i=0; i<count; ++i) {
		points.push({
			x: randomPointSnappedToGrid(xmax, gridSize),
			y: randomPointSnappedToGrid(ymax, gridSize),
		});
	}
	makeXYUnique(points);
	points.sort(function(a,b){return a.x-b.x});
	return points;
}

function pointsToString(points) {
		var s = "";
		for (var p=0; p<points.length; ++p) {
			if (s.length>0)
				s+=":";
			s += points[p].x + "," + points[p].y+","+"green";
		}
		return s;
}

var start=new Date();
var proportionalCount = 0;
var candidateCount = 0;
for (var e=0; e<EXPERIMENT_COUNT; ++e) {
	var points = randomPoints(POINT_COUNT,  X_RANGE, Y_RANGE, GRID_SIZE);
	var candidates = squaresTouchingPoints(points);
	candidateCount += candidates.length;
	var disjointset = maximumDisjointSet(candidates);
	if (disjointset.length >= points.length-1) 
		proportionalCount++;
	else {
		console.log(points.length+" points, "+disjointset.length+" squares");
		if (disjointset.length < points.length-2) {
			console.log("\t points="+pointsToString(points));
			console.log("\t candidates="+JSON.stringify(candidates));
		}
	}
}
var elapsed=new Date()-start;
var elapsedMean = Math.round(elapsed/EXPERIMENT_COUNT);
var candidateCountMean = (candidateCount/EXPERIMENT_COUNT);

console.log(proportionalCount+" proportional out of "+EXPERIMENT_COUNT+" experiments ("+(100.0*proportionalCount/EXPERIMENT_COUNT)+"%). "+candidateCountMean+" avg candidate count. "+elapsedMean+" avg time [ms].")
