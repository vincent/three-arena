
define('threearena/examples/demo',
    ['lodash', 'threejs', 'threearena/game', 'threearena/utils',
      'threearena/character/ogro', 'threearena/character/ratamahatta', 'threearena/character/monsterdog',
      'threearena/elements/interactiveobject',
      'threearena/elements/autospawn',
      'threearena/spell/bite',
      'threearena/spell/fireaura',
      'threearena/spell/firebullet',

      'machinejs',
      'threearena/behaviours/minion'
    ],

    function(_, THREE, Game, Utils, Ogro, Ratamahatta, Dog, InterativeObject, SpawningPool, BiteSpell, FireAuraSpell, FireBulletSpell,    Machine, MinionBehaviour) {
    'use strict';

	var Demo = function() {

		var settings = {

            container: document.getElementById('game-container'),

            positions: {
                spawn: new THREE.Vector3( 0, 0, 0 ),
                origin: new THREE.Vector3( 0, 0, 0 ),
                maporigin: new THREE.Vector3( -142, 0, 139 ),
                neartower: new THREE.Vector3(  -51, 14, 62 ),
                nearcamp: new THREE.Vector3( -78.2, 15.5, 100 ),
            },

			preload: [
			    'cacheonly!/gamedata/dota_map_full_compress2_normals.jpg',
			    'cacheonly!/gamedata/dota_map_full_compress2.jpg',
			    'cacheonly!/gamedata/dota_map_full_compress2_specular.jpg',
			    'cacheonly!/gamedata/models/marketplace.obj',
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
			    'cacheonly!/gamedata/maps/mountains.obj',
                'cacheonly!/gamedata/maps/mountains_trees.obj'
			]
		};

        settings.positions.spawn = settings.positions.nearcamp;

		Game.apply(this, [ settings ]);
	};

    Demo.prototype = _.clone(Game.prototype);



    Demo.prototype.afterCreate = function() {

        var self = this;

        // A state Machine 
        var machine = new Machine();        

        // Another character
        var ogro = new Ogro({
            onLoad: function(){
                this.state.team = 0;
                self.addCharacter( this );

                // learn some spells
                ogro.learnSpell( FireAuraSpell );
                ogro.learnSpell( FireBulletSpell );
            }
        });

        // A spawning pool
        var pool = new SpawningPool({
            entity: Dog,
            groupOf: 1,
            eachGroupInterval: 30 * 1000,
            // towards: new THREE.Vector3( -179.3, 13.8, 181.2 ),
            // path: [
            //     // bottom-right lane
            //     new THREE.Vector3(  190.0, 17.1, -129.1 ),
            //     new THREE.Vector3(  200.5, 17.0,  -84.7 ),
            //     new THREE.Vector3(  209.3, 14.1,  -65.5 ),
            //     new THREE.Vector3(  213.5,  1.0,    6.4 ),
            //     new THREE.Vector3(  169.0, 13.7,   88.4 ),
            //     new THREE.Vector3(  123.5,  7.1,  133.8 ),
            //     new THREE.Vector3(   73.4,  8.6,  173.1 ),
            //     new THREE.Vector3(   41.9, 11.4,  163.5 ),
            //     new THREE.Vector3(   60.5,  0.0,  212.9 ),
            //     new THREE.Vector3(  -11.8, 13.3,  213.4 ),
            //     new THREE.Vector3(  -27.4, 14.1,  210.4 ),
            //     new THREE.Vector3(  -61.9,  9.5,  210.9 ),
            //     new THREE.Vector3(  -81.3,  2.8,  210.4 ),
            //     new THREE.Vector3(  -83.6,  9.2,  182.1 ),
            //     new THREE.Vector3( -108.2, 15.4,  158.5 ),
            //     new THREE.Vector3( -133.4, 16.9,  156.7 ),
            //     new THREE.Vector3( -178.5, 13.9,  181.4 )
            // ]
        });
        pool.bind('spawnedone', function(character){
            character.state.team = 1;
            character.learnSpell(BiteSpell);
            character.state.autoAttacks = true;
            character.state.autoAttackSpell = 0;

            character.objective = self.objectives[0];
            character.behaviour = machine.generateTree(MinionBehaviour, character, character.states);
            self.bind('everysec', function () {
                character.behaviour = character.behaviour.tick();
            });
        });
        pool.position.set( 170.9, 17.8, -132.3);
        this.addSpawningPool(pool);
        pool.start();
    };



    Demo.prototype._initGround = function( done ) {

        var self = this;

        var ambient = 0x555555, diffuse = 0xbbbbbb, specular = 0x060606, shininess = 30;

        var uniforms;
        var shader = THREE.ShaderLib[ "normalmap" ];
        var uniforms = THREE.UniformsUtils.clone( shader.uniforms );

        uniforms[ "tNormal" ].value = THREE.ImageUtils.loadTexture( "/gamedata/dota_map_full_compress2_normals.jpg" );
        uniforms[ "tDiffuse" ].value = THREE.ImageUtils.loadTexture( "/gamedata/dota_map_full_compress2.jpg" );
        uniforms[ "tSpecular" ].value = THREE.ImageUtils.loadTexture( "/gamedata/dota_map_full_compress2_specular.jpg" );

        uniforms[ "enableAO" ].value = false;
        uniforms[ "enableDiffuse" ].value = true;
        uniforms[ "enableSpecular" ].value = true;

        uniforms[ "uDiffuseColor" ].value.setHex( diffuse );
        uniforms[ "uSpecularColor" ].value.setHex( specular );
        uniforms[ "uAmbientColor" ].value.setHex( ambient );

        uniforms[ "uNormalScale" ].value.set( 0.8, 0.8 );

        uniforms[ "uShininess" ].value = shininess;

        uniforms[ "wrapRGB" ].value.set( 0.575, 0.5, 0.5 );

        var parameters = { fragmentShader: shader.fragmentShader, vertexShader: shader.vertexShader, uniforms: uniforms, lights: true, fog: true };
        var material = new THREE.ShaderMaterial( parameters );
        // material.wrapAround = true;

        // model
        var loader = new THREE.OBJLoader( );
        loader.load( '/gamedata/maps/mountains.obj', function ( object ) {
            self.ground = object;
            
            self.ground.traverse( function ( child ) {
                if ( child instanceof THREE.Mesh ) {
                    child.material = material;
                    child.geometry.computeVertexNormals();
                    child.geometry.computeTangents();

                    child.receiveShadow = true;
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
                var interact = new InterativeObject();
                interact.position.set(-99, 12.3, 104);
                interact.menu = {
                    items: [
                        { action:'sell', name:'Potion', price:20 }
                    ],
                };
                interact.add( object );

                self.scene.add( interact );
                done();

            });
        });
    };

    return Demo;
});