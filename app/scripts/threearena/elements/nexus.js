
define('threearena/elements/nexus',
    ['lodash', 'threejs', 'threearena/entity'], function(_, THREE, Entity) {

    var Nexus = function(options) {

    	var self = this;

        Entity.apply(this);

        var loader = new THREE.ColladaLoader();
        loader.load( '/gamedata/models/rts_elements.dae', function ( loaded ) {

	        // var mesh = new THREE.Mesh( new THREE.CubeGeometry(3, 20, 3, 1, 1, 1) , new THREE.MeshBasicMaterial({ color: options.color }));
	        var mesh = loaded.scene.getObjectByName('Obelisk3');

            mesh.castShadow = true;
            mesh.rotation.x = -90 * Math.PI / 180;
            mesh.scale.set(4, 4, 4);
            mesh.position.set(0, 0, 0);

	        self.add(mesh);

	        options.onLoad && options.onLoad(self);
	    });
	};

	Nexus.prototype = new Entity();


	Nexus.prototype.constructor = Nexus;
	return Nexus;
});