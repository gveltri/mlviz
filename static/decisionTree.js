// decisionTree.js
// Gerardo Veltri
// dependencies: d3

var decisionTree = function(params) {

    // store variables from parameters
    this.selection_string = params.selection_string;
    this.nodes            = params.nodes;
    this.series           = params.series;
    this.levels           = params.levels;
    this.node_settings    = params.node_settings,
    this.axis_mapping     = params.axis_mapping,
    this.target_mapping   = params.target_mapping,
    this.speed            = 1000;

    this.initializeSVG();

    for (i=0;i<this.series.length;i++) {
	this.drawLineBetweenNodes(i);
    }
};

decisionTree.prototype.initializeSVG = function() {

    // calculate dimensions of container
    this.height = d3.select(this.selection_string).node().getBoundingClientRect().height;
    this.width = d3.select(this.selection_string).node().getBoundingClientRect().width;

    // init tooltip
    var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // compute level axes
    this.level_axes = {};
    var _length_axis_interval = this.height / (this.levels + 1);
    for (i = 1; i <= this.levels; i++) {
	this.level_axes[String(i)] = i * _length_axis_interval;
    }

    // organize nodes into levels for drawing
    var first_node;
    for (node_name in this.nodes) {
	if (this.nodes[node_name].level == 1) {
	    first_node = node_name;
	}
    }
    this.first_node = first_node; // save for later use

    var nodes_by_level = {1:
			  [this.nodes[first_node]]
			 };
    for (level=1;level<this.levels;level++) {
	for (node_idx in nodes_by_level[level]) {
	    if (nodes_by_level[level+1] == null) {
		nodes_by_level[level+1] = [];
	    }
	    var left = nodes_by_level[level][node_idx].left,
		right = nodes_by_level[level][node_idx].right;

	    if (left != null) {
		nodes_by_level[level+1].push(this.nodes[left]);
	    }
	    if (right != null) {
		nodes_by_level[level+1].push(this.nodes[right]);
	    }
	}
    }

    // append base svg
    this.svg = d3.select(this.selection_string)
	.append('svg')
	.attr('height', this.height)
	.attr('width', this.width);

    // time text element
    this.time_text = this.svg
	.append("g")
	.append("text")
	.attr("y", this.height - 10);

    // time text element
    this.ticket_text = this.svg
	.append("g")
	.append("text")
	.attr("x", this.width/2 )
	.attr("y", this.height - 10);

    // draw nodes
    for (level in nodes_by_level) {
	var num_nodes_in_level = nodes_by_level[level].length;
	var _width_axis_interval = this.width / (num_nodes_in_level + 1);

	for (i=0; i < nodes_by_level[level].length; i++) {
	    var node_obj = nodes_by_level[level][i],
		self     = this, // retain this for mouseover function
		g        = this.svg.append("g"),
		leaf     = node_obj.threshold == -2,
		fill     = leaf ?
		this.target_mapping[node_obj.target][2] :
		this.axis_mapping[node_obj.feature][2];

	    var rect = g.append("rect")
		.attr("id", node_obj.name.split(' ').join('-') )
		.attr("y", this.level_axes[level] - (this.node_settings.height/2))
		.attr("x", (_width_axis_interval * (i+1)) - (this.node_settings.width/2))
		.attr("width", this.node_settings.width)
		.attr("height", this.node_settings.height)
		.attr("fill", fill)
		.attr("stroke-width", 1)
		.attr("stroke", "gray")
		.attr("opacity", 0.8)
		.on("mouseover", function(d) {
		    cur_node = self.nodes[this.id.split('-').join(' ')];
		    // configure tooltip text

		    var feature_list = ['impurity'].concat(Object.keys(self.target_mapping));
		    var tooltip_string = "<b>" + cur_node['show_name']  + "</b><br>"
		    for (attribute in feature_list) {
			attribute = feature_list[attribute];
			tooltip_string = attribute != '_data' ? tooltip_string.concat(capitalizeFirstLetter(attribute) + ": " + cur_node[attribute]  + "<br>") :
			    tooltip_string.concat("");
		    }
		    // show tooltip
		    tooltip.transition()
			.duration(200)
			.style("opacity", .9);
		    tooltip.html(tooltip_string)
			.style("left", (d3.event.pageX + 20) + "px")
			.style("top", (d3.event.pageY - 28) + "px");

		    // darken desk
		    d3.select(this)
			.transition()
			.duration(100)
			.attr("opacity", 1);

		})
	        .on("mouseout", function(d) {
		    tooltip.transition()
		        .duration(500)
		        .style("opacity", 0);

		    d3.select(this)
			.transition()
			.duration(100)
			.attr("opacity", 0.8)

		})

	    // g.append('text')
	    // 	.html(node)
	    // 	.attr('dx', rect.attr("x"))
	    // 	.attr('dy', parseInt(rect.attr("y")) - 5);

            this.nodes[node_obj.name]['_data'] = {
                'coordinates' : [this.width/2 - (this.node_settings.width/2),
				 this.level_axes[node_obj.level] - (this.node_settings.height/2) ],
                'd3_object' : rect
            };
	}
    }


};

decisionTree.prototype.traverseTree = function(data_point) {
    // example_data_point = {
    // 	'sepal length (cm)': 4.4,
    // 	'sepal width (cm)' : 2,
    // 	'petal length (cm)': 6.5
    // }
    var duration = 1,
	curr_node = this.nodes[this.first_node],
	self = this;

    if (data_point[curr_node['feature']] <= curr_node['threshold']) {
	console.log(curr_node['feature']+ ' ' + data_point[curr_node['feature']] + ' is less than or equal to ' + curr_node['threshold'])
	self.activateNode(curr_node.name, self.nodes[curr_node['left']].name)
	curr_node = self.nodes[curr_node['left']];
    }
    else {
	console.log(curr_node['feature']+ ' ' + data_point[curr_node['feature']] + ' is greater than ' + curr_node['threshold'])
	self.activateNode(curr_node.name, self.nodes[curr_node['right']].name)
	curr_node = self.nodes[curr_node['right']]
    }
    var interval = setInterval(function() {
	if (curr_node.threshold == -2) {
	    clearInterval(interval);
	}

	if (data_point[curr_node['feature']] <= curr_node['threshold']) {
	    console.log(curr_node['feature']+ ' ' + data_point[curr_node['feature']] + ' is less than or equal to ' + curr_node['threshold'])
	    self.activateNode(curr_node.name, self.nodes[curr_node['left']].name)
	    curr_node = self.nodes[curr_node['left']];
	}
	else {
	    console.log(curr_node['feature']+ ' ' + data_point[curr_node['feature']] + ' is greater than ' + curr_node['threshold'])
	    self.activateNode(curr_node.name, self.nodes[curr_node['right']].name)
	    curr_node = self.nodes[curr_node['right']]
	}
    },this.speed * duration);

}



decisionTree.prototype.drawLineBetweenNodes  = function(cursor) {

    var origin           = this.nodes[this.series[cursor].origin]['_data']['d3_object'],
        destination      = this.nodes[this.series[cursor].destination]['_data']['d3_object'],
        origin_node      = this.nodes[this.series[cursor].origin],
        destination_node = this.nodes[this.series[cursor].destination],
        new_coords       = calculateCoords(origin,destination);

    origin_node['_data'][this.series[cursor].destination] = {'x': new_coords.origin_x,
							     'y': new_coords.origin_y};
    destination_node['_data'][this.series[cursor].origin] = {'x': new_coords.destination_x,
							     'y': new_coords.destination_y };

    var line_coords = getLine(origin_node, destination_node);

    var path = this.svg.append("path")
	.attr("class", "line")
	.attr("d", basis_line(line_coords))
	.attr("stroke", "#999")
	.attr("fill", "none");

    origin_node['_data'][this.series[cursor].destination]['path']        = path;
    origin_node['_data'][this.series[cursor].destination]['line_coords'] = line_coords;
}

decisionTree.prototype.activateNode = function(origin, destination) {

    var path        = this.nodes[origin]['_data'][destination]['path'],
	line_coords = this.nodes[origin]['_data'][destination]['line_coords'],
	duration    = 1;
    //var line_coords = getLine(origin_node, destination_node);

    // var path = this.svg.append("path")
    // 	.attr("class", "line")
    // 	.attr("d", basis_line(line_coords))
    // 	.attr("stroke", "#999")
    // 	.attr("fill", "none");

    // this.ticket_text.html(this.series[cursor].id + ": " + this.series[cursor].origin + " >> " + this.series[cursor].destination);

    var _c = this.svg.append("circle")
    	.attr("r", 3)
	.attr("fill", "red")
	.attr("transform", "translate(" + line_coords[0].x + "," + line_coords[0].y + ")");

    _c.transition()
	.duration(this.speed * duration)
	.attrTween("transform", translateAlong(path.node()))
	.each("end", function() { _c.remove() });

};


// returns beginning and end coordinates for path between two nodes
// assumes nodes are rectangles
function calculateCoords(node_origin, node_destination) {
    // calculate center of rectangles
    var origin_x = parseInt(node_origin.attr("x")) + (node_origin.attr("width")/2),
        origin_y = parseInt(node_origin.attr("y")) + (node_origin.attr("height")/2),
        destination_x = parseInt(node_destination.attr("x")) + (node_destination.attr("width")/2),
        destination_y = parseInt(node_destination.attr("y")) + (node_destination.attr("height")/2);

    var multiplier = 1;
    if (origin_x == destination_x) {
	// if destination is higher than origin,
	// destination plus height
	// origin minus height
	// else switched
	multiplier = destination_y > origin_y ? 1 : -1;

	return {
	    'origin_x': origin_x,
	    'origin_y': origin_y + (multiplier) * (parseInt(node_origin.attr("height")/2) ),
	    'destination_x': destination_x,
	    'destination_y': destination_y + (multiplier * -1) * (parseInt(node_destination.attr("height")/2))
	};
    }
    else if (origin_y == destination_y) {
	      multiplier = destination_x > origin_x ? 1 : -1;

	return {
	    'origin_x': origin_x + (multiplier) * (parseInt(node_origin.attr("width")/2) ),
	    'origin_y': origin_y,
	    'destination_x': destination_x + (multiplier * -1) * (parseInt(node_destination.attr("width")/2)),
	    'destination_y': destination_y
	};
    }
    else {
	      multiplier = destination_x > origin_x ? 1 : -1;
	      var multiplier_y = destination_y > origin_y ? 1 : -1;

	      var a = Math.abs(destination_x - origin_x);
	      var b = Math.abs(destination_y - origin_y);

	      var b_1 = parseInt(node_origin.attr("height")) / 2;
	      var a_1 = b_1 / (b / a);

	      var b_2 = parseInt(node_destination.attr("height")) / 2;
	      var a_2 = b_2 / (b / a)

	      return {
	          'origin_x': a_1 * (multiplier) + origin_x,
	          'origin_y': b_1 * (multiplier_y) + origin_y,
	          'destination_x': a_2 * (multiplier * -1) + destination_x,
	          'destination_y': b_2 * (multiplier_y * -1) + destination_y
	      };
    }
}

function getLine(node_source, node_target) {
    var source_x = node_source['_data'][node_target.name].x,
        source_y = node_source['_data'][node_target.name].y,
        target_x = node_target['_data'][node_source.name].x,
        target_y = node_target['_data'][node_source.name].y;

    if (source_x == target_x) {
	      return [
	          {'x': source_x, 'y': source_y},
	          {'x': target_x, 'y': target_y}
	      ];
    }
    else if (target_y == source_y) {
	      return [
	          {'x': source_x, 'y': source_y},
	          {'x': target_x, 'y': target_y}
	      ];
    }

	  var _2_x = source_x,
	      _2_y = (source_y + target_y)/2;

	  var _3_x = target_x,
	      _3_y = _2_y = (source_y + target_y)/2;

	  return [
	      {'x': source_x, 'y': source_y},
	      {'x': _2_x, 'y': _2_y},
	      {'x': _3_x, 'y': _3_y},
	      {'x': target_x, 'y': target_y}
	  ];

}

// Returns an attrTween for translating along the specified path element.
function translateAlong(path) {
    var l = path.getTotalLength();
    return function(d, i, a) {
    	  return function(t) {
    	      var p = path.getPointAtLength(t * l);
    	      return "translate(" + p.x + "," + p.y + ")";
    	  };
    };
}

var basis_line = d3.svg.line()
    .tension(0)
    .interpolate("basis")
    .x(function(d,i) {
	      return d.x;
    })
    .y(function(d) {
	      return d.y;
    });

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
