// plot3D is a 3D plotting engine for THREEjs
// created by Gerardo Veltri

var plot3D = function(args) {
    this.scene       = args.scene,
    this.size        = args.size,
    this.ranges      = args.ranges,
    this.pos         = args.pos || [0,0,0],
    this.mesh_ranges = [[this.pos[0] - this.size[0]/2, this.pos[0] - this.size[0]/2 + this.size[0]],
			[this.pos[1] - this.size[1]/2, this.pos[1] - this.size[1]/2 + this.size[1]], 
			[this.pos[2], this.pos[2] + this.size[2]]],
    this.axis_labels = args.axis_labels || ['x', 'y', 'z'],
    this.side_type   = args.side_type || 'grid';
    
    if (this.side_type == 'grid') {
	this.side = generateGridBackground(this.size, this.pos);
    }
    else if (this.side_type == 'flat') {
	this.side = generateFlatBackground(this.size, this.pos);
    }

    this.scene.add(this.side);

    
    var axis_labels = this.axis_labels,
	mesh_ranges = this.mesh_ranges,
	scene       = this.scene;
    var loader = new THREE.FontLoader();
    loader.load("/static/helvetiker_regular.typeface.json", function ( font ) {
	var label_options = {
	    font: font,
	    size: 2,
	    curveSegments: 1,
	    height: 0.1
	},
	    x_label   = new THREE.TextGeometry( axis_labels[0], label_options),
	    y_label   = new THREE.TextGeometry( axis_labels[1], label_options),
	    z_label   = new THREE.TextGeometry( axis_labels[2], label_options);

	var xmesh = new THREE.Mesh( x_label, new THREE.MeshBasicMaterial( { color: 0xff9999 } ) ),
	    ymesh = new THREE.Mesh( y_label, new THREE.MeshBasicMaterial( { color: 0x99ff99 } ) ),
	    zmesh = new THREE.Mesh( z_label, new THREE.MeshBasicMaterial( { color: 0x9999ff } ) );

	var box = new THREE.Box3().setFromObject( xmesh );

	xmesh.position.set(mesh_ranges[0][1] - box.max.x, mesh_ranges[1][0], mesh_ranges[2][0]);
	ymesh.position.set(mesh_ranges[1][0], mesh_ranges[1][1] - 2, mesh_ranges[2][0]);
	zmesh.position.set(mesh_ranges[1][0], mesh_ranges[1][0], mesh_ranges[2][1]);
	zmesh.rotation.y = Math.PI/2;
	
	scene.add(xmesh);
	scene.add(ymesh);
	scene.add(zmesh);

    });
    
    function generateGridBackground(size, pos) {
	var side  = generateGrid([size[0]/2, size[1]/2], 2),
	    side1 = generateGrid([size[2]/2, size[1]/2], 2),
	    side2 = generateGrid([size[2]/2, size[0]/2], 2);

	side1.position.set(-size[0]/2, 0, size[2]/2);
	side1.rotation.y = Math.PI / 2;
	side.add(side1);
	side2.position.set(0, -size[1]/2, size[2]/2);
	side2.rotation.x = Math.PI / 2;
	side2.rotation.z = Math.PI / 2;
	side.add(side2);
	side.position.set(pos[0], pos[1], pos[2]);

	
	return side
    }

    function generateFlatBackground(size, pos) {

	var side = new THREE.Mesh( new THREE.PlaneGeometry(size[0], size[1]),
				   new THREE.MeshLambertMaterial( { color: 0xAAAAAA, side: THREE.DoubleSide } ));
	side.receiveShadow = true;
	side.castShadow = true;

	var side1 = new THREE.Mesh( new THREE.PlaneGeometry(size[2], size[1]),
				    new THREE.MeshLambertMaterial( { color: 0xAAAAAA, side: THREE.DoubleSide }));
	side1.position.set(-size[0]/2, 0, size[2]/2);
	side1.rotation.y = Math.PI / 2;
	side.add(side1);
	side1.receiveShadow = true;
	side1.castShadow = true;

	var side2 = new THREE.Mesh( new THREE.PlaneGeometry(size[2], size[0]),
				    new THREE.MeshLambertMaterial( { color: 0xAAAAAA, side: THREE.DoubleSide } ));
	side2.position.set(0, -size[1]/2, size[2]/2);
	side2.rotation.x = Math.PI / 2;
	side2.rotation.z = Math.PI / 2;
	side.add(side2);
	side2.receiveShadow = true;
	side2.castShadow = true;

	side.position.set(pos[0], pos[1], pos[2]);

	return side

    }

    function generateGrid(size, step) {

	var geometry = new THREE.Geometry();
	var material = new THREE.LineBasicMaterial( { color: 0x666666, opacity: 1 } );

	for ( var i = - size[0]; i <= size[0]; i += step ) {
	    geometry.vertices.push( new THREE.Vector3( - size[1], i, 0) );
	    geometry.vertices.push( new THREE.Vector3( size[1], i, 0) );

	}

	for ( var i = - size[1]; i <= size[1]; i += step ) {
	    geometry.vertices.push( new THREE.Vector3(i, - size[0], 0) );
	    geometry.vertices.push( new THREE.Vector3(i, size[0], 0 ) );
	}

	return new THREE.Line( geometry, material, THREE.LinePieces );
    }
    
};

plot3D.prototype.plot = function(points) {
    // example input point:
    // {'values': {x: 3,y: 5,z: 6},
    //  'size': 5,
    //  'color': 0xAAAAAA,
    //  'shape': 'square'}
    this.points = this.points || [];
    for (i=0;i<points.length;i++) {
	var point = points[i];
	var point_obj;
	if (point.shape == 'cube') {
	    point_obj = new THREE.Mesh( new THREE.BoxGeometry(point.size,point.size,point.size),
					new THREE.MeshLambertMaterial( { color: point.color, opacity: 1 } ));
	}
	else if (point.shape == 'sphere') {
	    point_obj = new THREE.Mesh( new THREE.SphereGeometry(point.size),
					new THREE.MeshLambertMaterial( { color: point.color } ));
	}
	point_obj.position.set(
	    scaleToRange(point.values.x, this.ranges[0], this.mesh_ranges[0]),
	    scaleToRange(point.values.y, this.ranges[1], this.mesh_ranges[1]),
	    scaleToRange(point.values.z, this.ranges[2], this.mesh_ranges[2])
	);
	point_obj.receiveShadow = true;
	point_obj['original_data'] = point;

	this.scene.add(point_obj);
	this.points.push(point_obj);
    }

    function scaleToRange(old_value, old_range, new_range, margin) {
	var margin    = margin || (new_range[1] - new_range[0]) * 0.001,
	    rate      = (new_range[1] - new_range[0]) / ((old_range[1] + margin) - (old_range[0] - margin)),
	    offset    = new_range[0] - ((old_range[0] - margin) * rate),
	    new_value = (old_value * rate) + offset;
	return new_value;
    }
    
}


