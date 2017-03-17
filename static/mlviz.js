var dt,
    axis_mapping = {
	'petal length (cm)': ['x', 0xff9999, '#ff9999'],
	'sepal length (cm)': ['y', 0x99ff99, '#99ff99'],
	'sepal width (cm)' : ['z', 0x9999ff, '#9999ff']
    },
    target_mapping = {
	'setosa': [0, 0xFF00FF,'#ff00ff'],
	'versicolor': [1, 0xFFFF00,'#ffff00'],
	'virginica': [2, 0x00FFFF,'#00ffff']
    };


// get flower data and initialize 3d plot
$.get('/static/data/flower_data.json', function(data) {

    // format input data to feed into plot3D
    var _x = [],
	_y = [],
	_z = [];
    for (x in data) {
	data[x]['values'] = {};
	data[x]['values'].x = data[x]['petal length (cm)'];
	data[x]['values'].y = data[x]['sepal length (cm)'];
	data[x]['values'].z = data[x]['sepal width (cm)'];
	data[x]['size'] = 0.5;
	data[x]['shape'] = 'cube';
	if (data[x]['target'] == 0) {
	    data[x]['color'] = 0xFF00FF;
	}
	else if (data[x]['target'] == 1) {
	    data[x]['color'] = 0xFFFF00;
	}
	else if (data[x]['target'] == 2) {
	    data[x]['color'] = 0x00FFFF;
	}

	_x.push(data[x]['values']['x']);
	_y.push(data[x]['values']['y']);
	_z.push(data[x]['values']['z']);

    }

    var ranges = [[Math.min.apply(null,_x), Math.max.apply(null,_x)],
		  [Math.min.apply(null,_y), Math.max.apply(null,_y)],
		  [Math.min.apply(null,_z), Math.max.apply(null,_z)]];
    init_scene(data, ranges, ['petal length (cm)', 'sepal length (cm)', 'sepal width (cm)']);
});

// get decision tree data and initialize decision tree
$.get('/static/data/decision_tree.json', function(data) {

    var params = {
	selection_string: '#decision-tree',
	nodes           : data['nodes'],
	series          : data['series'],
	levels          : data['levels'],
	node_settings   : {height: 20, width: 30, fill: '#cccccc'},
	axis_mapping    : axis_mapping,
	target_mapping  : target_mapping
    }

    dt = new decisionTree(params);
    
});


function init_scene(flower_data, ranges, labels) {
    var scene    = new THREE.Scene(),
	camera   = new THREE.PerspectiveCamera( 75, 1, 0.1, 1000 ),
	renderer = new THREE.WebGLRenderer(),
	height   = 750,
	width    = 750;

    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x333333, 1);
    renderer.setSize( width, height );
    renderer.shadowMap.enabled = true;

    camera.position.z = 80;
    camera.position.x = 50;
    camera.position.y = 20;

    var container = document.getElementById('chart');
    container.appendChild( renderer.domElement );

    scene.add( new THREE.AmbientLight( 0xffffff, 1) );
    var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
    directionalLight.position.set( 30, 10, 50 );
    directionalLight.castShadow = true;
    scene.add( directionalLight );
    
    plot = new plot3D({
	size        : [50, 50, 50],
	ranges      : ranges,
	scene       : scene,
	side_type   : 'grid',
	axis_labels : labels
    });

    // Orbit Controls
    var focus_location = new THREE.Vector3(plot.mesh_ranges[0][0],
					   plot.mesh_ranges[1][0],
					   plot.mesh_ranges[2][0] );

    controls = new THREE.OrbitControls( camera, renderer.domElement );

    controls.minDistance = 10;
    controls.maxDistance = 150;
    controls.target = focus_location;
    controls.minPolarAngle = 0; 
    controls.maxPolarAngle = Math.PI/2;
    controls.minAzimuthAngle = 0;
    controls.maxAzimuthAngle = Math.PI/2;

    controls.update();

    // Plotting
    plot.plot(flower_data);

    // mouse over effect
    var mouse     = new THREE.Vector2(),
	raycaster = new THREE.Raycaster(),
	enlarged  = null;

    var div = d3.select("body").append("div")
	.attr("class", "tooltip")
	.style("opacity", 0);

    renderer.domElement.addEventListener('mousemove', function(event) {
	mouse.x = ( event.offsetX / width ) * 2 - 1;
	mouse.y = - ( event.offsetY / height ) * 2 + 1;
	
	raycaster.setFromCamera(mouse, camera);

	var intersects = raycaster.intersectObjects(plot.points);

	if (enlarged != null) {
	    enlarged.object.scale.set(1,1,1);
	}

	if (intersects.length > 0) {
	    intersects[0].object.scale.set(3,3,3);
	    enlarged = intersects[0];

	    div.transition()
		.duration(200)
		.style("opacity", 1);
	    div.html(plot.axis_labels[0] + ': ' + intersects[0].object.original_data.values.x + '<br>' + plot.axis_labels[1] + ': ' + intersects[0].object.original_data.values.y + '<br>' + plot.axis_labels[2] + ': ' + intersects[0].object.original_data.values.z)
		.style("left", (event.pageX + 10) + "px")
		.style("top", (event.pageY - 70) + "px");
	}
	else {
	    div.transition()
		.duration(0)
		.style("opacity", 0)
		.style("left", (0) + "px")
		.style("top", (0) + "px");;
	}
	
    }, false);

    renderer.domElement.addEventListener('click', function(event) {
	mouse.x = ( event.offsetX / width ) * 2 - 1;
	mouse.y = - ( event.offsetY / height ) * 2 + 1;
	
	raycaster.setFromCamera(mouse, camera);

	var intersects = raycaster.intersectObjects(plot.points);

	if (intersects.length > 0) {
	    dt.traverseTree(intersects[0].object.original_data);
	}

    }, false);

    var render = function () {
	requestAnimationFrame( render );
	renderer.render(scene, camera);
    };

    render()

}

// function random_points(n) {
//     var output = [];
//     for (i=0;i<n;i++) {
// 	var inputs = {x: Math.random(), y: Math.random(), z: Math.random()};
// 	output.push({
// 	    values: {x: i/n, y: Math.cos(i/50)/15 + 0.5, z: inputs.z},
// 	    size  : 0.3,
// 	    color : 0xCCCCCC,
// 	    shape : 'sphere'
// 	});
// 	output.push({
// 	    values: inputs,
// 	    size  : 0.5,
// 	    color : 0xFF00FF,
// 	    shape : 'cube'
// 	});
//     }
//     return output
// }
