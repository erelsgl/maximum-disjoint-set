/**
 * a unit-test for maximum-disjoint-set based on JSTS.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-03
 */

var should = require('should');
var _ = require('underscore');
var jsts = require("../jsts-extended");
var factory = new jsts.geom.GeometryFactory();

var South = jsts.Side.South;
var North = jsts.Side.North;
var East  = jsts.Side.East;
var West  = jsts.Side.West;
var Right = jsts.Turn.Right;
var Left = jsts.Turn.Left;

describe('SimpleRectilinearPolygon', function() {
	var srp1 = new jsts.geom.SimpleRectilinearPolygon([0,0, 10,20]);  // rectangle
	var srp2 = new jsts.geom.SimpleRectilinearPolygon([-10,0, 0,10, 10,0, 20,20]); // ח shape
	var srp3 = new jsts.geom.SimpleRectilinearPolygon([-10,0, 0,10, 10,0, 40,20]); // elongated ח shape
	it('initializes from minimal set of xy values', function() {
		srp1.getCoordinates().should.eql(
			[ { x: 0, y: 0}, { x: 10, y: 0}, { x: 10, y: 20}, { x: 0, y: 20},  { x: 0, y: 0} ]);
		srp2.points.should.eql(
			[{x:-10,y:0}, {x:0,y:0}, {x:0,y:10}, {x:10,y:10},{x:10,y:0}, {x:20,y:0}, {x:20,y:20}, {x:-10,y:20}, {x:-10,y:0}]);
	})
	
	it('calculates the turn direction and convexity of corners', function() {
		srp1.corners.pluck("turn").should.eql([Left,Left,Left,Left]);
		srp2.corners.pluck("turn").should.eql([Left,Left,Right,Right,Left,Left,Left,Left]);

		srp1.corners.pluck("isConvex").should.eql([true,true,true,true]);
		srp2.corners.pluck("isConvex").should.eql([true,true,false,false,true,true,true,true]);
	})

	it('knows whether points are internal or external', function() {
		srp1.contains({x:5,y:10}).should.equal(true);   // internal
		srp1.contains({x:10,y:10}).should.equal(false); // boundary
		srp1.contains({x:16,y:10}).should.equal(false); // external
		
		srp3.contains({x:20,y:10}).should.equal(true);   // internal
		srp3.contains({x:50,y:10}).should.equal(false); // external
		srp3.contains({x:10,y:10}).should.equal(false); // boundary
	})
	
	it('finds closest segments', function() {
		var point1 = {x:5,y:10};
		srp1.findClosestSegment(East, point1).getX().should.equal(10);
		srp1.findClosestSegment(West, point1).getX().should.equal(0);
		srp1.findClosestSegment(North, point1).getY().should.equal(20);
		srp1.findClosestSegment(South, point1).getY().should.equal(0);

		var point2 = {x:-5,y:5};
		srp2.findClosestSegment(East, point2).getX().should.equal(0);
		srp2.findClosestSegment(West, point2).getX().should.equal(-10);
		srp2.findClosestSegment(North, point2).getY().should.equal(20);
		srp2.findClosestSegment(South, point2).getY().should.equal(0);

		var point3 = {x:15,y:5};
		srp2.findClosestSegment(East, point3).getX().should.equal(20);
		srp2.findClosestSegment(West, point3).getX().should.equal(10);
		srp2.findClosestSegment(North, point3).getY().should.equal(20);
		srp2.findClosestSegment(South, point3).getY().should.equal(0);
	})
	
	it('finds distance fromo segments to nearest corners', function() {
		var segment = srp2.segments.first;	
						       segment.distanceToNearestConcaveCorner().should.equal(Infinity); // no concave corner visible
		segment=segment.next;  segment.distanceToNearestConcaveCorner().should.equal(Infinity); // no concave corner visible
		segment=segment.next;  segment.distanceToNearestConcaveCorner().should.equal(Infinity); // no concave corner visible
		segment=segment.next;  segment.distanceToNearestConcaveCorner().should.equal(Infinity); // no concave corner visible
		segment=segment.next;  segment.distanceToNearestConcaveCorner().should.equal(Infinity); // no concave corner visible
		segment=segment.next;  segment.distanceToNearestConcaveCorner().should.equal(10);
		segment=segment.next;  segment.distanceToNearestConcaveCorner().should.equal(10);
		segment=segment.next;  segment.distanceToNearestConcaveCorner().should.equal(10);

		var segment = srp3.segments.first;	
						       segment.distanceToNearestConcaveCorner().should.equal(Infinity); // no concave corner visible
		segment=segment.next;  segment.distanceToNearestConcaveCorner().should.equal(Infinity); // no concave corner visible
		segment=segment.next;  segment.distanceToNearestConcaveCorner().should.equal(Infinity); // no concave corner visible
		segment=segment.next;  segment.distanceToNearestConcaveCorner().should.equal(Infinity); // no concave corner visible
		segment=segment.next;  segment.distanceToNearestConcaveCorner().should.equal(Infinity); // no concave corner visible
		segment=segment.next;  segment.distanceToNearestConcaveCorner().should.equal(30);
		segment=segment.next;  segment.distanceToNearestConcaveCorner().should.equal(10);
		segment=segment.next;  segment.distanceToNearestConcaveCorner().should.equal(10);
	});

	it('finds distance from corners to nearest segments', function() {
		var corner = srp3.corners.first;	
		                    corner.distanceToNearestSegment(North).should.equal(20);
		corner=corner.next; corner.distanceToNearestSegment(North).should.equal(20);   corner.distanceToNearestSegment(West).should.equal(10);
		corner=corner.next; corner.distanceToNearestSegment(North).should.equal(10);   corner.distanceToNearestSegment(West).should.equal(10);
		corner=corner.next; corner.distanceToNearestSegment(North).should.equal(10);   corner.distanceToNearestSegment(East).should.equal(30); 
		corner=corner.next; corner.distanceToNearestSegment(North).should.equal(20); 
		corner=corner.next; corner.distanceToNearestSegment(North).should.equal(20);   corner.distanceToNearestSegment(West).should.equal(30); 
		corner=corner.next; corner.distanceToNearestSegment(South).should.equal(20);   corner.distanceToNearestSegment(West).should.equal(50); 
		corner=corner.next; corner.distanceToNearestSegment(South).should.equal(20);   corner.distanceToNearestSegment(East).should.equal(50); 
	})

	it('finds distance from segments to nearest borders', function() {
		var segment = srp3.segments.first;	
		                       segment.distanceToNearestBorder().should.equal(20);
		segment=segment.next;  
		segment=segment.next;  
		segment=segment.next;  
		segment=segment.next;  segment.distanceToNearestBorder().should.equal(20);
		segment=segment.next;  segment.distanceToNearestBorder().should.equal(30);
		segment=segment.next;  segment.distanceToNearestBorder().should.equal(10);
		segment=segment.next;  segment.distanceToNearestBorder().should.equal(10);
	})
	

	it('finds continuators', function() {
		var segment = srp3.segments.first;	
		                       segment.continuator().should.eql({minx:-10,maxx:0,miny:0,maxy:10});
		segment=segment.next;  
		segment=segment.next;  
		segment=segment.next;  
		segment=segment.next;  
		segment=segment.next;  segment.continuator().should.eql({minx:20,maxx:40,miny:0,maxy:20});
		segment=segment.next;  
		segment=segment.next;  
	});

	it('removes erasable regions in rectangles', function removeErasableRegionRectangles() {
		var srp = new jsts.geom.SimpleRectilinearPolygon([0,0, 10,35]);
//				console.log("0: "+srp)
		srp.corners.pluck("x").should.eql([0,10,10, 0]);
		srp.corners.pluck("y").should.eql([0, 0,35,35]);
		srp.removeErasableRegion(srp.segments.first);
//				console.log("1: "+srp)
		srp.corners.pluck("x").should.eql([ 0,10,10, 0]);
		srp.corners.pluck("y").should.eql([10,10,35,35]);
		srp.removeErasableRegion(srp.segments.first);
//				console.log("2: "+srp)
		srp.corners.pluck("x").should.eql([ 0,10,10, 0]);
		srp.corners.pluck("y").should.eql([20,20,35,35]);
		srp.removeErasableRegion(srp.segments.first);
//				console.log("3: "+srp)
		srp.corners.pluck("x").should.eql([ 0,10,10, 0]);
		srp.corners.pluck("y").should.eql([25,25,35,35]);
	});

	it.only('removes erasable regions in hexagons', function () {
		var srp = new jsts.geom.SimpleRectilinearPolygon([0,0, 10,25, 20,35]);
//				console.log("0: "+srp)
		srp.corners.pluck("x").should.eql([0,10,10,20,20, 0]);
		srp.corners.pluck("y").should.eql([0, 0,25,25,35,35]);
		srp.removeErasableRegion(srp.segments.first);
//				console.log("1: "+srp)
		srp.corners.pluck("x").should.eql([ 0,10,10,20,20, 0]);
		srp.corners.pluck("y").should.eql([10,10,25,25,35,35]);
		srp.removeErasableRegion(srp.segments.first);
//				console.log("2: "+srp)
		srp.corners.pluck("x").should.eql([ 0,10,10,20,20, 0]);
		srp.corners.pluck("y").should.eql([20,20,25,25,35,35]);
		srp.removeErasableRegion(srp.segments.first);
//				console.log("3: "+srp)
		srp.corners.pluck("x").should.eql([ 0,20,20, 0]);
		srp.corners.pluck("y").should.eql([25,25,35,35]);

		srp = new jsts.geom.SimpleRectilinearPolygon([10,0, 20,35, 0,25]);
		//		console.log("0: "+srp)
		srp.corners.pluck("x").should.eql([10,20,20, 0, 0,10]);
		srp.corners.pluck("y").should.eql([ 0, 0,35,35,25,25]);
		srp.removeErasableRegion(srp.segments.first);
		//		console.log("1: "+srp)
		srp.corners.pluck("x").should.eql([10,20,20, 0, 0,10]);
		srp.corners.pluck("y").should.eql([10,10,35,35,25,25]);
		srp.removeErasableRegion(srp.segments.first);
		//		console.log("2: "+srp)
		srp.corners.pluck("x").should.eql([10,20,20, 0, 0,10]);
		srp.corners.pluck("y").should.eql([20,20,35,35,25,25]);
		srp.removeErasableRegion(srp.segments.first);
		//		console.log("3: "+srp)
		srp.corners.pluck("x").should.eql([20,20, 0, 0]);
		srp.corners.pluck("y").should.eql([25,35,35,25]);
	});
});