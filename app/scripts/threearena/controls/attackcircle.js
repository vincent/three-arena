/**
 * @module Controls/AttackCircle
 */
define('threearena/controls/attackcircle',
	['lodash', 'threejs'], function(_, THREE, HUD) {

	var AttackCircle = function ( radius ) {
		var self = this;

        THREE.Object3D.apply(this);

		// this.shape = new THREE.Shape();
		// this.shape.moveTo( 0, radius );
		// this.shape.quadraticCurveTo( radius, radius, radius, 0 );
		// this.shape.quadraticCurveTo( radius, -radius, 0, -radius );

		var start 	= new THREE.Vector3( -radius, 0, 0 ),
			middle 	= new THREE.Vector3( 0, 0, -radius ),
			end 	= new THREE.Vector3(  radius, 0, 0 );

        this.shape = new THREE.QuadraticBezierCurve3(start, middle, end);

		this.points = this.shape.getSpacedPoints( 10 );
		this.slots = [];
	};

	AttackCircle.prototype = new THREE.Object3D(); // Object.create(THREE.Object3D);

	AttackCircle.prototype.has = function ( object ) {

		return this.slots.indexOf( object ) > -1;
	};

	AttackCircle.prototype.place = function ( object ) {

		var point = Math.ceil(this.points.length / 2 + this.slots.length);

		var position = this.localToWorld( this.points[ point ].clone() );

		this.slots.push( object );
        object.position.set( position.x, position.y, position.y );

		return position;
	};

	return AttackCircle;
});