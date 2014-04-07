/**
 * Divide a cake such that each color gets a fair number of points.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

var jsts = require('jsts');
var _ = require("underscore");

/**
 * @param points array of points, e.g. [{x:0,y:0}, {x:100,y:100}, etc.]
 * @param envelope defines the bounding rectangle, e.g. {minx: 0, maxx: 100, miny: 0, maxy: 200}
 * @param maxAspectRatio number>=1: the maximum width/height ratio of the returned rectangle.
 * @return a rectangle contained within the envelope, with aspect ratio at most maxAspectRatio, that contains a largest number of points. 
 */
jsts.algorithm.squareWithMaxNumOfPoints = function(points, envelope, maxAspectRatio) {
	if (!maxAspectRatio) maxAspectRatio=1;
	var width = envelope.maxx-envelope.minx;
	var height = envelope.maxy-envelope.miny;
	var largestWidthPerHeight = maxAspectRatio*height;
	var largestHeightPerWidth = maxAspectRatio*width;
	var result = {};
	if (width<=largestWidthPerHeight && height<=largestHeightPerWidth) {  
		// the envelope has aspect ratio at most maxAspectRatio, so just return it entirely:
		result = envelope;
	} else if (width>largestWidthPerHeight) {
		var miny = result.miny = envelope.miny;
		var maxy = result.maxy = envelope.maxy;
		var xValues = _.chain(points)
			.pluck("x")                           // get the x values
			.sort(function(a,b) { return a-b; })  // sort them in increasing order
			.uniq(/*sorted=*/true)                // keep each value only once
			.filter(function(x) { return envelope.minx<=x && x<=envelope.maxx})  // keep only values in the envelope
			.value();
		if (xValues.length==0) {  // no x values in the envelope - just return any rectangle within the envelope
			result.minx = envelope.minx;
			result.maxx = result.minx+largestWidthPerHeight;
		} else {
			var maxNum   = 0;
			for (var i=0; i<xValues.length; ++i) {
				var minx = xValues[i];
				var maxx = Math.min(minx+largestWidthPerHeight, envelope.maxx);
				var curNum = numPointsWithinXY(points, minx,miny,maxx,maxy);
				if (curNum>maxNum) {
					maxNum = curNum;
					result.minx = minx;
					result.maxx = maxx;
				}
			}
		}
	} else {  // height>largestHeightPerWidth
		var minx = result.minx = envelope.minx;
		var maxx = result.maxx = envelope.maxx;
		var yValues = _.chain(points)
			.pluck("y")                           // get the x values
			.sort(function(a,b) { return a-b; })  // sort them in increasing order
			.uniq(/*sorted=*/true)                // keep each value only once
			.filter(function(y) { return envelope.miny<=y && y<=envelope.maxy})  // keep only values in the envelope
			.value();
		if (yValues.length==0) {  // no y values in the envelope - just return any rectangle within the envelope
			result.miny = envelope.miny;
			result.maxy = result.miny+largestHeightPerWidth;
		} else { 
			var maxNum   = 0;
			for (var i=0; i<yValues.length; ++i) {
				var miny = yValues[i];
				var maxy = Math.min(miny+largestHeightPerWidth, envelope.maxy);
				var curNum = numPointsWithinXY(points, minx,miny,maxx,maxy);
				if (curNum>maxNum) {
					maxNum = curNum;
					result.miny = miny;
					result.maxy = maxy;
				}
			}
		}
	}
	return result;
}

var numPointsWithinXY = function(points, minx,miny,maxx,maxy) {
	return points.reduce(function(prev,cur) {
		return prev + (minx<=cur.x && cur.x<=maxx && miny<=cur.y && cur.y<=maxy);
	}, 0);
}
