/**
 * a unit-test for half-proportional-division
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

var should = require('should');
var jsts = require("../jsts-extended");

var alg = jsts.algorithm.halfProportionalDivision; // shorthand
var testAlgorithm = jsts.algorithm.testDivisionAlgorithm;
var alg3walls = jsts.algorithm.halfProportionalDivision3Walls; // shorthand
var sukka    = new jsts.geom.Envelope(0,400, 0,Infinity);

jsts.algorithm.FIND_DIVISION_WITH_LARGEST_MIN_VALUE = false; // find only value 1

describe('3 walls algorithm', function() {
	it('single agent with 2 points A', function() {
		var agent1 = [{x:100,y:100},{x:250,y:100}]; agent1.color='blue';
		testAlgorithm(alg3walls, [[agent1], sukka], 2);
	})
	it('single agent with 2 points B', function() {
		var agent1 = [{x:100,y:100},{x:350,y:100}]; agent1.color='blue';
		testAlgorithm(alg3walls, [[agent1], sukka], 2);
	})

	it('2 agents with 4 points in corners - no intersection', function() {
		var agent1 = [{x:0,y:0},{x:0,y:300},{x:300,y:0},{x:300,y:300}]; agent1.color='blue';
		var agent2 = [{x:0,y:0},{x:0,y:400},{x:400,y:0},{x:400,y:400}]; agent2.color='red';
		alg3walls([agent1,agent2], sukka).slice(0).should.eql(
				[{ maxx: 400, miny: 300, minx: 0, maxy: 700, color:'red' },
				 { minx: 0, miny: 0, maxx: 300, maxy: 300, color:'blue' }, ]);
	})

	it('3 agents with 6 points - r-shape bug', function() {
		var agent1 = [{x:10,y:0},{x:50,y:0},{x:100,y:0},{x:250,y:0},{x:310,y:0},{x:390,y:0}]; agent1.color='green';
		var agent2 = [{x:10,y:0},{x:60,y:0},{x:150,y:0},{x:200,y:0},{x:220,y:0},{x:390,y:0}]; agent2.color='blue';
		var agent3 = [{x:200,y:350},{x:210,y:350},{x:220,y:350},{x:230,y:350},{x:240,y:350},{x:250,y:350}]; agent3.color='red';
		//testAlgorithm(alg3walls, [[agent1,agent2], sukka], 6);
		testAlgorithm(alg3walls, [[agent1,agent2,agent3], sukka], 2);
	})

	it('3 agents with 6 points - 2-thin bug', function() {
		var agent1 = [{x:0,y:0},{x:180,y:0},{x:0,y:200},{x:100,y:200},{x:200,y:200},{x:300,y:200}]; agent1.color='blue';
		var agent2 = [{x:0,y:0},{x:0,y:190},{x:370,y:370},{x:370,y:380},{x:370,y:390},{x:370,y:400}]; agent2.color='green';
		var agent3 = [{x:0,y:0},{x:400,y:0},{x:0,y:220},{x:400,y:320},{x:400,y:360},{x:400,y:400}]; agent3.color='red';
		//testAlgorithm(alg3walls, [[agent1,agent2], sukka], 6);
		testAlgorithm(alg3walls, [[agent1,agent2,agent3], sukka], 2);
	})

	it('3 agents with 6 points - levels bug', function() {
		var agent1 = [{x:0,y:0},{x:180,y:0},{x:0,y:0},{x:100,y:220},{x:200,y:400},{x:300,y:400}]; agent1.color='blue';
		var agent2 = [{x:0,y:0},{x:0,y:200},{x:370,y:360},{x:370,y:370},{x:370,y:390},{x:370,y:200}]; agent2.color='green';
		var agent3 = [{x:0,y:200},{x:400,y:190},{x:0,y:200},{x:400,y:380},{x:400,y:0},{x:400,y:320}]; agent3.color='red';
		testAlgorithm(alg3walls, [[agent1,agent2,agent3], sukka], 2);
	})

	it('3 agents with 6 points - levels bug 2', function() {
		var agent1 = [{x:0,y:190},{x:0,y:400},{x:100,y:200},{x:200,y:390},{x:300,y:200},{x:180,y:400}]; agent1.color='blue';
		var agent2 = [{x:0,y:0},{x:0,y:380},{x:370,y:0},{x:370,y:320},{x:370,y:360},{x:370,y:0}]; agent2.color='green';
		var agent3 = [{x:0,y:200},{x:400,y:0},{x:0,y:370},{x:400,y:0},{x:400,y:220},{x:400,y:200}]; agent3.color='red';
		testAlgorithm(alg3walls, [[agent1,agent2,agent3], sukka], 2);
	})
});
