
define('threearena/elements/shop',
    ['lodash', 'threejs', 'threearena/elements/interactiveobject'], function(_, THREE, InteractiveObject) {

    var Shop = function(options) {

        InteractiveObject.apply(this, [ options ]);

        var self = this;

        var loader = new THREE.OBJLoader( );
        loader.load( '/gamedata/models/marketplace.obj', function ( object ) {

            object.traverse( function ( child ) {
                if ( child instanceof THREE.Mesh ) {
                    child.material.map = THREE.ImageUtils.loadTexture( "/gamedata/models/TXT0499.jpg" );

                    // child.glowable = true;
                    // self.intersectObjects.push(child);
                }
            });

            object.scale = new THREE.Vector3(8, 8, 8);
            self.add( object );

            options.onLoad && options.onLoad();
        });
    };
    Shop.prototype = new InteractiveObject();

    /////////////////////

    Shop.prototype.constructor = THREE.Shop;

    return Shop;
});