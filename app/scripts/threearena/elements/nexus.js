
define('threearena/elements/nexus',
    ['lodash', 'threejs', 'threearena/entity'], function(_, THREE, Entity) {

    var Nexus = function(options) {

        Entity.apply(this);

        var mesh = new THREE.Mesh( new THREE.CubeGeometry(3, 20, 3, 1, 1, 1) , new THREE.MeshBasicMaterial({ color: options.color }));
        this.add(mesh);
	};

	Nexus.prototype = new Entity();


	Nexus.prototype.constructor = Nexus;
	return Nexus;
});