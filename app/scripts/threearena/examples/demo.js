
define('threearena/examples/demo',
    ['lodash', 'threejs', 'threearena/game', 'threearena/utils', 'threearena/character/ogro', 'threearena/character/ratamahatta',
      'threearena/spell/fireaura' ],

    function(_, THREE, Game, Utils, Ogro, Ratamahatta, FireAuraSpell) {
    'use strict';

	var Demo = function() {

		var settings = {

            container: document.getElementById('game-container'),

            positions: {
                spawn: new THREE.Vector3( 0, 0, 0 ),
                origin: new THREE.Vector3( 0, 0, 0 ),
                maporigin: new THREE.Vector3( -142, 0, 139 ),
                neartower: new THREE.Vector3(  -51, 14, 62 )
            },

			preload: [
			    'cacheonly!/gamedata/dota_map_full_compress2_normals.jpg',
			    'cacheonly!/gamedata/dota_map_full_compress2.jpg',
			    'cacheonly!/gamedata/dota_map_full_compress2_specular.jpg',
			    'cacheonly!/gamedata/dota_simple.obj',
			    'cacheonly!/gamedata/tree_pine.dae',
			    'cacheonly!/gamedata/tree_oak.dae',
			    'cacheonly!/gamedata/textures/lensflare1_alpha.png',
			    'cacheonly!/gamedata/textures/lensflare0_alpha.png',
			    'cacheonly!/gamedata/lantern.dae',
			    'cacheonly!/gamedata/textures/lantern_1024_c.png',
			    'cacheonly!/gamedata/Bark_Tile.jpg',
			    'cacheonly!/gamedata/oak-branch-c.png',
			    'cacheonly!/gamedata/Bark_Tile.jpg',
			    'cacheonly!/gamedata/leaf-mapple-yellow-c.png',
			    'cacheonly!/gamedata/oak-branch-c.png',
			    'cacheonly!/gamedata/dota_trees.obj'
			]
		};

        settings.positions.spawn = settings.positions.neartower;

		Game.apply(this, [ settings ]);
	};

    Demo.prototype = _.clone(Game.prototype);



    Demo.prototype.afterCreate = function() {

        var rata = new Ratamahatta();

        // Another character
        var ogro = new Ogro();

        ogro.learnSpell( FireAuraSpell );
        ogro.learnSpell( FireAuraSpell );
        ogro.learnSpell( FireAuraSpell );
        ogro.learnSpell( FireAuraSpell );

        this.addCharacter( ogro );
        this.addCharacter( rata );

        // Move Ogro along a path
        var path = [ 
            new THREE.Vector3(  -64.7, 14.6, 63.8 ),
            new THREE.Vector3( -101.9, 10.7, 39.6 ),
            new THREE.Vector3(  -94.6,  6.0, -6.3 ),
            new THREE.Vector3(  -40.6,  5.9,  2.4 ),
            new THREE.Vector3(  -35.7,  6.6, 22.4 ),  
        ];

        var tween = rata.moveAlong( path ); //, { start: false } ).start();
        tween.repeat( Infinity ).yoyo( true ).start( );
    };



    Demo.prototype._initGround = function( done ) {

        var self = this;

        var ambient = 0xaaaaaa, diffuse = 0xbbbbbb, specular = 0x060606, shininess = 30;

        var uniforms;
        var shader = THREE.ShaderLib[ "normalmap" ];
        var uniforms = THREE.UniformsUtils.clone( shader.uniforms );

        uniforms[ "uNormalScale" ].value.set( 0.8, 0.8 );

        uniforms[ "tNormal" ].value = THREE.ImageUtils.loadTexture( "/gamedata/dota_map_full_compress2_normals.jpg" );
        uniforms[ "tDiffuse" ].value = THREE.ImageUtils.loadTexture( "/gamedata/dota_map_full_compress2.jpg" );
        uniforms[ "tSpecular" ].value = THREE.ImageUtils.loadTexture( "/gamedata/dota_map_full_compress2_specular.jpg" );

        uniforms[ "enableAO" ].value = false;
        uniforms[ "enableDiffuse" ].value = true;
        uniforms[ "enableSpecular" ].value = true;

        uniforms[ "uDiffuseColor" ].value.setHex( diffuse );
        uniforms[ "uSpecularColor" ].value.setHex( specular );
        uniforms[ "uAmbientColor" ].value.setHex( ambient );

        uniforms[ "uShininess" ].value = shininess;

        uniforms[ "wrapRGB" ].value.set( 0.575, 0.5, 0.5 );

        var parameters = { fragmentShader: shader.fragmentShader, vertexShader: shader.vertexShader, uniforms: uniforms, lights: true, fog: true };
        var material = new THREE.ShaderMaterial( parameters );
        // material.wrapAround = true;

        // model
        var loader = new THREE.OBJLoader( );
        loader.load( '/gamedata/maps/mountains.obj', function ( object ) {
            self.ground = object;
            //self.ground.receiveShadow = true;

            self.ground.traverse( function ( child ) {
                if ( child instanceof THREE.Mesh ) {
                    child.material = material;
                    child.geometry.computeVertexNormals();
                    child.geometry.computeTangents();
                }
            } );

            self.intersectObjects = self.intersectObjects.concat(self.ground.children[0].children);
            self.scene.add( self.ground );

            var loader = new THREE.OBJLoader( );
            loader.load( '/gamedata/models/marketplace.obj', function ( object ) {

                object.traverse( function ( child ) {
                    if ( child instanceof THREE.Mesh ) {
                        child.material.map = THREE.ImageUtils.loadTexture( "/gamedata/models/TXT0499.jpg" );

                        child.glowable = true;
                        self.intersectObjects.push(child);
                    }
                });

                object.scale = new THREE.Vector3(6, 6, 6);
                // object.position.set(-80, 20, 90);
                // object.position.set(-90, 13.5, 89);
                object.position.set(-99, 12.3, 104);
                self.scene.add( object );
                done();

            });
        });
    };

    return Demo;
});