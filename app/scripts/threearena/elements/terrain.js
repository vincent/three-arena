define('threearena/elements/terrain',
    ['lodash', 'threejs'], function(_, THREE) {

    /**
     * @exports threearena/elements/terrain
     */
    var Terrain = function(options) {

    	THREE.Object3D.apply(this);

        var self = this;

        var ambient = 0xffffff, diffuse = 0xffffff, specular = 0xdd5500, shininess = 10;

        var uniforms;
        var shader = THREE.ShaderLib[ "normalmap" ];
        var uniforms = THREE.UniformsUtils.clone( shader.uniforms );

        uniforms[ "tNormal" ].value = THREE.ImageUtils.loadTexture( "/gamedata/dota_map_full_compress2_specular.jpg" );
        uniforms[ "tDiffuse" ].value = THREE.ImageUtils.loadTexture( "/gamedata/dota_map_full_compress3.jpg" );
        uniforms[ "tSpecular" ].value = THREE.ImageUtils.loadTexture( "/gamedata/dota_map_full_compress3.jpg" );

        uniforms[ "enableAO" ].value = false;
        uniforms[ "enableDiffuse" ].value = true;
        uniforms[ "enableSpecular" ].value = false;

        uniforms[ "uDiffuseColor" ].value.setHex( diffuse );
        uniforms[ "uSpecularColor" ].value.setHex( specular );
        uniforms[ "uAmbientColor" ].value.setHex( ambient );

        uniforms[ "uNormalScale" ].value.set( 2, 2 );

        uniforms[ "uShininess" ].value = shininess;

        //uniforms[ "wrapRGB" ].value.set( 0.575, 0.5, 0.5 );

        var parameters = { fragmentShader: shader.fragmentShader, vertexShader: shader.vertexShader, uniforms: uniforms, lights: true, fog: true };
        var material = new THREE.ShaderMaterial( parameters );
        // material.wrapAround = true;

        // Water
        // var water = new Water( 50, 100 );
        // water.position.set( -100, 12, 0 );
        // self.scene.add( water );

        // Terrain
        var loader = new THREE.OBJLoader( );
        loader.load( '/gamedata/maps/mountains.obj', function ( object ) {
            
            object.traverse( function ( child ) {
                if ( child instanceof THREE.Mesh ) {
                    child.material = material;
                    child.geometry.computeVertexNormals();
                    child.geometry.computeTangents();

                    child.receiveShadow = true;
                }
            } );

            self.add(object);

            options.onLoad && options.onLoad(self);
        });
    };

	Terrain.prototype = Object.create(THREE.Object3D.prototype);

	Terrain.prototype.constructor = Terrain;
	return Terrain;
});