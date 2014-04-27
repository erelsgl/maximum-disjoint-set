/**
 * Divide a cake such that each color gets a square with 1/2n of its points.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

var jsts = require('jsts');
require("./factory-utils");
require("./AxisParallelRectangle");
require("./square-with-max-points");
require("./transformations");
require("./point-utils");
var _ = require("underscore");
var util = require("util");
var ValueFunction = require("./ValueFunction");

var DEFAULT_ENVELOPE = new jsts.geom.Envelope(-Infinity,Infinity, -Infinity,Infinity);

function TRACE (numOfAgents, s) {
	console.log(Array(Math.max(0,6-numOfAgents)).join("   ")+s);
};

function TRACE_PARTITION(numOfAgents, s, y, k, northAgents, northPlots, southAgents, southPlots) {
	TRACE(numOfAgents,s+"(k="+k+", y="+round2(y)+"): "+southAgents.length+" south agents ("+_.pluck(southAgents,"color")+") got "+southPlots.length+" plots and "+northAgents.length+" north agents ("+_.pluck(northAgents,"color")+") got "+northPlots.length+" plots.");
}

var roundFields3 = jsts.algorithm.roundFields.bind(0, 3);
var round2 = function(x) { 	return Math.round(x*100)/100; }

jsts.Side = {
	South: 0,
	West: 1,
	North: 2,
	East: 3
};





/**
 * Find a set of axis-parallel fat rectangles representing a fair-and-square division for the valueFunctions
 * 
 * @param valueFunctions an array in which each entry represents the valuation of a single agent.
 * The valuation of an agent is represented by points with fields {x,y}. Each point has the same value.
 *    Each agent may also have a field "color", that is copied to the rectangle.
 * 
 * @param envelope object with fields {minx,miny, maxx,maxy}; defines the boundaries for the landplots.
 * 
 * @param maxAspectRatio maximum aspect ratio allowed for the pieces.
 * 
 * @return a list of rectangles; each rectangle is {minx,miny, maxx,maxy [,color]}.
 */
jsts.geom.GeometryFactory.prototype.createHalfProportionalDivision = function(valueFunctions, envelope, maxAspectRatio) {
	var landplots;
	var openSides = [];
	if (envelope.minx==-Infinity) openSides.push(jsts.Side.West);
	if (envelope.miny==-Infinity) openSides.push(jsts.Side.South);
	if (envelope.maxx== Infinity) openSides.push(jsts.Side.East);
	if (envelope.maxy== Infinity) openSides.push(jsts.Side.North);
	if (openSides.length==0) {
		landplots = jsts.algorithm.halfProportionalDivision4Walls(valueFunctions, envelope, maxAspectRatio);
	} else if (openSides.length==1) {
		var openSide = openSides[0];
		landplots = jsts.algorithm.halfProportionalDivision3Walls(valueFunctions, envelope, maxAspectRatio, openSide);
	} else if (openSides.length==2) {
		openSides.sort();
		var openSidesString = openSides.join("");
		var mapOpenSidesStringToSouthernSide = {
			"01": jsts.Side.North,
			"12": jsts.Side.East,
			"23": jsts.Side.South,
			"03": jsts.Side.West,
		}
		if (!(openSidesString in mapOpenSidesStringToSouthernSide)) {
			throw new Error("Cannot understand envelope "+JSON.stringify(envelope));
		}
		var southernSide = mapOpenSidesStringToSouthernSide[openSidesString];
		landplots = jsts.algorithm.halfProportionalDivision2Walls(valueFunctions, envelope, maxAspectRatio, southernSide);
	}
	
	return landplots.map(function(landplot) {
		var rect = new jsts.geom.AxisParallelRectangle(landplot.minx, landplot.miny, landplot.maxx, landplot.maxy, this);
		rect.color = landplot.color;
		return rect;
	});
};

jsts.algorithm.halfProportionalDivision4Walls = function(agentsValuePoints, envelope, maxAspectRatio) {
	TRACE(10,"")
	var width = envelope.maxx-envelope.minx, height = envelope.maxy-envelope.miny;
	var shorterSide = (width<=height? jsts.Side.South: jsts.Side.East);
	var valueFunctions = ValueFunction.createArray(2*agentsValuePoints.length, agentsValuePoints)
	var landplots = runDivisionAlgorithm(
			norm3Walls, shorterSide /* The norm4walls algorithm assumes that the southern side is shorter */,
			valueFunctions, envelope, maxAspectRatio);
	landplots.forEach(roundFields3);
	return landplots;
}

jsts.algorithm.halfProportionalDivision3Walls = function(agentsValuePoints, envelope, maxAspectRatio, openSide) {
	TRACE(10,"")
	var southernSide = (openSide+2)%4;  // the southern side is opposite to the open side.
	var valueFunctions = ValueFunction.createArray(2*agentsValuePoints.length-1, agentsValuePoints)
	var landplots = runDivisionAlgorithm(
			norm3Walls, southernSide,
			valueFunctions, envelope, maxAspectRatio);
	landplots.forEach(roundFields3);
	return landplots;
};

jsts.algorithm.halfProportionalDivision2Walls = function(agentsValuePoints, envelope, maxAspectRatio, southernSide) {
	TRACE(10,"")
	var valueFunctions = ValueFunction.createArray(2*agentsValuePoints.length-1, agentsValuePoints);
	var landplots = runDivisionAlgorithm(
			norm2Walls, southernSide,
			valueFunctions, envelope, maxAspectRatio);
	landplots.forEach(roundFields3);
	return landplots;
};

/**
 * Test the given algorithm (jsts.algorithm.halfProportionalDivision4Walls or jsts.algorithm.halfProportionalDivision3Walls)
 * with the given args (array) 
 * and make sure that every agent gets the required num of points.
 */
jsts.algorithm.testAlgorithm = function(algorithm, args, requiredNum)  {
	var landplots = algorithm.apply(0, args);
	var setsOfPoints = args[0];
	
	if (landplots.length<setsOfPoints.length) {
		setsOfPoints.forEach(function(points) {
			console.log(jsts.algorithm.pointsToString(points, points.color)+":");
		});
		throw new Error("Not enough land-plots: "+JSON.stringify(landplots));
	}
	setsOfPoints.forEach(function(points) {
		landplots.forEach(function(landplot) {
			if (points.color == landplot.color) {
				var pointsInLandplot = jsts.algorithm.numPointsInEnvelope(points, landplot);
				if (pointsInLandplot<requiredNum) {
					throw new Error("Not enough points for "+landplot.color+": expected "+requiredNum+" but found only "+pointsInLandplot+" from "+JSON.stringify(points)+" in landplot "+JSON.stringify(landplot));
				}
			}
		})
	})
 }




/************ NORMALIZATION *******************/

var runDivisionAlgorithm = function(normalizedDivisionFunction, southernSide, valueFunctions, envelope, maxAspectRatio) {
	if (valueFunctions.length==0) 
		return [];
	if (!maxAspectRatio) maxAspectRatio=1;

	var rotateTransformation = {rotateQuarters: southernSide - jsts.Side.South};
	enveloper = jsts.algorithm.transformAxisParallelRectangle(rotateTransformation, {minx:envelope.minx, maxx:envelope.maxx, miny:envelope.miny, maxy:envelope.maxy});

	var width = enveloper.maxx-enveloper.minx, height = enveloper.maxy-enveloper.miny;
	if (height<=0 && width<=0)
		throw new Error("Zero-sized envelope: "+JSON.stringify(enveloper));
	if (width<=0)
		width = height/1000;
	var scaleFactor = 1/width;
	var yLength = height*scaleFactor;

	// transform the system so that the envelope is [0,1]x[0,L], where L>=1:
	var transformation = 
		[rotateTransformation,
		 {translate: [-enveloper.minx,-enveloper.miny]},
		 {scale: scaleFactor}];

	var transformedvalueFunctions = valueFunctions.map(function(valueFunction) {
		// transform the points of the agent to the envelope [0,1]x[0,L]:
		return valueFunction.cloneWithNewPoints(
			jsts.algorithm.pointsInEnvelope(valueFunction.points, envelope)
			.map(jsts.algorithm.transformedPoint.bind(0,transformation)));
	});
	
	var landplots = normalizedDivisionFunction(transformedvalueFunctions, yLength, maxAspectRatio);

	// transform the system back:
	var reverseTransformation = jsts.algorithm.reverseTransformation(transformation);
	landplots.forEach(
		jsts.algorithm.transformAxisParallelRectangle.bind(0,reverseTransformation));

	return landplots;
}





/**
 * Normalized 3-walls algorithm:
 * - valueFunctions.length>=1
 * - The envelope is normalized to [0,1]x[0,yLength]
 * - maxAspectRatio>=1
 * - Value per agent: at least 2*n-1
 * - Landplots may overflow the northern border
 */
var norm3Walls = function(valueFunctions, yLength, maxAspectRatio) {
	var numOfAgents = valueFunctions.length;
	TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"): 3 Walls Algorithm");

	var initialCorners = [{x:0,y:1}, {x:0,y:0}, {x:1,y:0}, {x:1,y:1}];
	var maxVal = 2*numOfAgents-1;
	var minVal = 1;
	for (var requiredLandplotValue=maxVal; requiredLandplotValue>=minVal; requiredLandplotValue--) {
		var landplots = staircase3walls(valueFunctions, initialCorners, requiredLandplotValue);
		if (landplots.length==valueFunctions.length)
			return landplots;
	}
	return landplots;
}

/**
 * Normalized 3-walls staircase algorithm:
 * - valueFunctions.length>=1
 * - corners.length >= 4
 * - corners are ordered by non-decreasing x value, from the NW to the SW to the SE to the NE.
 * - Value per agent: at least 2*n-2+(corners.length-3)
 */
var staircase3walls = function(valueFunctions, corners, requiredLandplotValue) {
	var numOfAgents = valueFunctions.length;
	var numOfCorners = corners.length;
	TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"), trying to give each a value of "+requiredLandplotValue+" using a staircase algorithm with "+numOfCorners+" corners: "+JSON.stringify(corners));

	// for each agent, calculate the acceptable corner square with the smallest height above the x axis (t = y+s):
	var index = 0;
	valueFunctions.forEach(function(valueFunction) {
		valueFunction.index = index++; // for removing the winning agent later on
		var cornerSquares = [];
		for (var c=1; c<numOfCorners-1; ++c) {
			var prev = corners[c-1];
			var cur  = corners[c];
			var next = corners[c+1];
			var LShape = (prev.y>cur.y && cur.x<next.x);
			var JShape = (prev.x<cur.x && cur.y<next.y);
			
			if (LShape) {
				var squareSize = valueFunction.sizeOfSquareWithValue(cur, requiredLandplotValue, "NE");
				var height = cur.y+squareSize;
				cornerSquares.push({x:cur.x, y:cur.y, s:squareSize, t:height});
			} else if (JShape) {  
				var squareSize = valueFunction.sizeOfSquareWithValue(cur, requiredLandplotValue, "NW");
				var height = cur.y+squareSize;
				cornerSquares.push({x:cur.x, y:cur.y, s:squareSize, t:height});
			}
		}
		valueFunction.square = _.min(cornerSquares, function(square){return square.t});
	});

	// get the agent with the square with the smallest height overall:
	var winningAgent = _.min(valueFunctions, function(valueFunction) {
		return valueFunction.square.t;
	});

	if (!winningAgent.square || !isFinite(winningAgent.square.s)) {
		TRACE(numOfAgents, "-- no square with the required value "+requiredLandplotValue);
		return [];
	}

	var landplot = {
			minx: winningAgent.square.x,
			miny: winningAgent.square.y,
			maxx: winningAgent.square.x+winningAgent.square.s,
			maxy: winningAgent.square.y+winningAgent.square.s,
	};
	if (winningAgent.color) landplot.color = winningAgent.color;
	TRACE(numOfAgents, "++ agent "+winningAgent.index+" gets from the square "+JSON.stringify(winningAgent.square)+" the landplot "+JSON.stringify(landplot));
	
	if (valueFunctions.length==1)
		return [landplot];

	var remainingValueFunctions = valueFunctions.slice(0,winningAgent.index).concat(valueFunctions.slice(winningAgent.index+1,valueFunctions.length));

	// Create the remaining corners:
	var remainingCorners = [];
	remainingCorners.push(corners[0]);
	var westShadow = false, eastShadow = true;
	for (var c=1; c<numOfCorners-1; ++c) {
		var cur  = corners[c];
		if (cur.y>=landplot.maxy) {
			remainingCorners.push(cur);
			continue;
		}
		
		// HERE cur.y < landplot.maxy
		var yDistance = landplot.maxy-cur.y;

		var prev = corners[c-1];
		var next = corners[c+1];
		var LShape = (prev.y>cur.y && cur.x<next.x);
		var JShape = (prev.x<cur.x && cur.y<next.y);
		
		// Check the x-value of the current corner; note that x is non-decreasing:
		if (cur.x<landplot.minx) {       // WEST
			if (westShadow)  continue;     // skip all corners from the beginning of the west shadow to landplot.maxx

			if (xDistance<yDistance) {   // need to add a corner to the west
				if (prev.y > landplot.maxy) { // cur is an LShape
					remainingCorners.push({x:cur.x, y:landplot.maxy});
					remainingCorners.push({x:landplot.maxx, y:landplot.maxy});
					remainingCorners.push({x:landplot.maxx, y:landplot.miny});
				} else if (prev.x < cur.x) {  // cur is a ר shape
					remainingCorners.push({x:landplot.minx, y:cur.y});
					remainingCorners.push({x:landplot.minx, y:landplot.maxy});
					remainingCorners.push({x:landplot.maxx, y:landplot.maxy});
					remainingCorners.push({x:landplot.maxx, y:landplot.miny});
				} else if (prev.y > cur.y) {  // cur is an L Shape
					remainingCorners.pop(); // remove prev
					remainingCorners.push({x:landplot.minx, y:prev.y});
					remainingCorners.push({x:landplot.minx, y:landplot.maxy});
					remainingCorners.push({x:landplot.maxx, y:landplot.maxy});
					remainingCorners.push({x:landplot.maxx, y:landplot.miny});
				} else {
					console.warn("Unhandled condition in the west: prev="+JSON.stringify(prev)+" cur="+JSON.stringify(cur)+" next="+JSON.stringify(next));
					remainingCorners.push({x:landplot.minx, y:landplot.miny});
					remainingCorners.push({x:landplot.minx, y:landplot.maxy});
					remainingCorners.push({x:landplot.maxx, y:landplot.maxy});
					remainingCorners.push({x:landplot.maxx, y:landplot.miny});
				}
				westShadow = true;     // skip all corners from here to landplot.maxx
				continue;
			}
			remainingCorners.push(cur);

		} else 	if (cur.x<=landplot.maxx) { // SOUTH 
			if (westShadow)  continue;     // skip all corners from the beginning of the south shadow to landplot.maxx
			
			remainingCorners.push({x:landplot.minx, y:landplot.miny});
			remainingCorners.push({x:landplot.minx, y:landplot.maxy});
			remainingCorners.push({x:landplot.maxx, y:landplot.maxy});
			remainingCorners.push({x:landplot.maxx, y:landplot.miny});
			westShadow = true;
			
		} else {                           // EAST
			var xDistance = cur.x - landplot.maxx;
			if (xDistance<yDistance) 
				continue;
			
			if (eastShadow) {
				if (next.y > landplot.maxy) { // cur is a J Shape
					remainingCorners.pop();  // remove (maxx,miny)
					remainingCorners.pop();  // remove (maxx,maxy)
					remainingCorners.push({x:cur.x, y:landplot.maxy});
					// skip cur
				} else if (cur.x < next.x) {  // cur is an r shape
					remainingCorners.pop();  // remove (maxx,miny)
					remainingCorners.push({x:landplot.maxx, y:cur.y});
					//remainingCorners.push(cur); // skip cur
				} else if (next.y > cur.y) { // cur is a J Shape
					remainingCorners.pop();  // remove (maxx,miny)
					remainingCorners.push({x:landplot.maxx, y:cur.y});
					remainingCorners.push(cur);
				} else {
					console.warn("Unhandled condition in the east: prev="+JSON.stringify(prev)+" cur="+JSON.stringify(cur)+" next="+JSON.stringify(next));
				}
				eastShadow = false;
				continue;
			}
			remainingCorners.push(cur);
		}
	}
	remainingCorners.push(corners[numOfCorners-1]);

	var remainingLandplots = staircase2walls(remainingValueFunctions, remainingCorners, requiredLandplotValue);
	remainingLandplots.push(landplot);
	return remainingLandplots;
}



/**
 * Normalized 2-walls algorithm:
 * - valueFunctions.length>=1
 * - The envelope is normalized to [0,inf]x[0,inf]
 * - maxAspectRatio>=1
 * - Value per agent: at least 2*n-1
 * - Landplots may overflow the northern and/or the eastern borders
 */
var norm2Walls = function(valueFunctions, yLength, maxAspectRatio) {
	var numOfAgents = valueFunctions.length;
	TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"): 2 Walls Algorithm");
	
	var initialCorner = {x:0,y:0};
	for (var requiredLandplotValue=2*numOfAgents-1; requiredLandplotValue>=1; requiredLandplotValue--) {
		var landplots = staircase2walls(valueFunctions, [initialCorner], requiredLandplotValue);
		if (landplots.length==valueFunctions.length)
			return landplots;
	}
	return landplots;
}

/**
 * Normalized staircase algorithm:
 * - valueFunctions.length>=1
 * - corners.length >= 1
 * - corners are ordered by increasing y = decreasing x (from south-east to north-west)
 * - Value per agent: at least 2*n-2+corners.length
 */
var staircase2walls = function(valueFunctions, corners, requiredLandplotValue) {
	var numOfAgents = valueFunctions.length;
	var numOfCorners = corners.length;
	TRACE(numOfAgents,numOfAgents+" agents("+_.pluck(valueFunctions,"color")+"), trying to give each a value of "+requiredLandplotValue+" using a staircase algorithm with "+numOfCorners+" corners: "+JSON.stringify(corners));

	// for each agent, calculate the acceptable corner square with the smallest taxicab distance from the origin:
	var index = 0;
	valueFunctions.forEach(function(valueFunction) {
		valueFunction.index = index++; // for removing the winning agent later on
		var cornerSquares = corners.map(function(corner) {
			var squareSize = valueFunction.sizeOfSquareWithValue(corner, requiredLandplotValue, "NE");
			var taxicabDistance = corner.x+corner.y+squareSize;
			return {x:corner.x, y:corner.y, s:squareSize, t:taxicabDistance};
		});
		valueFunction.square = _.min(cornerSquares, function(square){return square.t});
	});

	// get the agent with the square with the smallest taxicab distance overall:
	var winningAgent = _.min(valueFunctions, function(valueFunction) {
		return valueFunction.square.t;
	});
	
	if (!winningAgent.square || !isFinite(winningAgent.square.s)) {
		TRACE(numOfAgents, "-- no square with the required value "+requiredLandplotValue);
		return [];
	}

	var landplot = {
			minx: winningAgent.square.x,
			miny: winningAgent.square.y,
			maxx: winningAgent.square.x+winningAgent.square.s,
			maxy: winningAgent.square.y+winningAgent.square.s,
	};
	if (winningAgent.color) landplot.color = winningAgent.color;
	TRACE(numOfAgents, "++ agent "+winningAgent.index+" gets from the square "+JSON.stringify(winningAgent.square)+" the landplot "+JSON.stringify(landplot));
	
	if (valueFunctions.length==1)
		return [landplot];

	var remainingValueFunctions = valueFunctions.slice(0,winningAgent.index).concat(valueFunctions.slice(winningAgent.index+1,valueFunctions.length));

	// Create the remaining corners:
	var remainingCorners = [];
	var c = 0;
	while (c<numOfCorners && corners[c].x>=landplot.maxx) {  // add corners to the southeast of the landplot
		remainingCorners.push(corners[c]);
		++c;
	}
	// HERE corners[c].x<landplot.maxx
	remainingCorners.push({x:landplot.maxx, y:corners[c].y});  // add southwest new corner
	while (c<numOfCorners && corners[c].y<landplot.maxy) { // skip corners shaded by the landplot
		++c;
	}
	// HERE corners[c].y>=landplot.maxy
	remainingCorners.push({x:corners[c-1].x, y:landplot.maxy});  // add northeast new corner
	while (c<numOfCorners) {  // add corners to the northwest of the landplot
		remainingCorners.push(corners[c]);
		++c;
	}

	var remainingLandplots = staircase2walls(remainingValueFunctions, remainingCorners, requiredLandplotValue);
	remainingLandplots.push(landplot);
	return remainingLandplots;
}

