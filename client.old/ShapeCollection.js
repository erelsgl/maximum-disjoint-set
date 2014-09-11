// A collection of JSTS shapes on an SVG paper
function ShapeCollection(svgpaper, defaultStyle) {
	var shapes = [];

	// Add a new shape: 
	shapes.add = function(shape, style) {
		for (var i in defaultStyle)
			if (!style[i])
				style[i] = defaultStyle[i];
		var shapeOnPaper;
		if (shape instanceof jsts.geom.AxisParallelRectangle)	{
			shapeOnPaper = svgpaper.rect(shape.maxx-shape.minx, shape.maxy-shape.miny);
			shapeOnPaper.move(shape.minx,shape.miny);
		} else if (shape instanceof jsts.geom.Polygon) {
			var coordinates = shape.getCoordinates().map(function(cur) {
				return cur.x+","+cur.y;
			}).join(" ");
			//console.log(coordinates);
			shapeOnPaper = svgpaper.polygon(coordinates);
		} else {
			console.dir(shape);
			throw new Error("Unrecognized shape");
		}
		shapeOnPaper.attr(style);
		shapeOnPaper.back();  // send behind points
		this.push(shapeOnPaper);
	}

	//remove all rectangles from the SVG paper:
	shapes.clear = function() {
		for (var r=0; r<this.length; ++r)
			this[r].remove();
		this.length = 0;
	}

	return shapes;
}

