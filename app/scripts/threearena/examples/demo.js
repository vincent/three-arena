
define('threearena/examples/demo',
    ['lodash', 'threejs', 'threearena/game', 'threearena/utils',
      'threearena/character/ogro', 'threearena/character/ratamahatta', 'threearena/character/monsterdog',
      'threearena/elements/interactiveobject',
      'threearena/elements/autospawn',
      'threearena/spell/bite',
      'threearena/spell/fireaura',
      'threearena/spell/firebullet',
      'threearena/particles/flies',

      'machinejs',
      'threearena/behaviours/minion',
      'threearena/behaviours/controlled'
    ],

    function(_, THREE, Game, Utils, Ogro, Ratamahatta, Dog, InterativeObject, SpawningPool, BiteSpell, FireAuraSpell, FireBulletSpell, Flies,    Machine, MinionBehaviour, ControlledBehaviour) {
    'use strict';

	var Demo = function(settings) {

		settings = _.merge({

            container: null,
            splashContainer: null,

            positions: {
                spawn: new THREE.Vector3( 0, 0, 0 ),
                origin: new THREE.Vector3( 0, 0, 0 ),
                maporigin: new THREE.Vector3( -142, 0, 139 ),
                neartower: new THREE.Vector3(  -51, 14, 62 ),
                nearcamp: new THREE.Vector3( -78.2, 15.5, 100 ),
            },

			preload: [

			]
		}, settings);

        settings.positions.spawn = settings.positions.nearcamp;

		Game.apply(this, [ settings ]);
	};

    Demo.prototype = _.clone(Game.prototype);



    Demo.prototype.afterCreate = function() {

        var self = this;

        // A state Machine 
        var machine = new Machine();        

        // Some flies
        var flies = new Flies(10);
        flies.position.set(-70, 20, 80);
        this.scene.add(flies);
        this.bind('update', _.bind(flies.update, flies));

        // Another character
        var ogro = new Ogro({
            onLoad: function(){
                var character = this;

                character.state.team = 0;

                // character.behaviour = machine.generateTree(ControlledBehaviour, character, character.states);
                // self.bind('update:behaviours', function () {
                //     character.behaviour = character.behaviour.tick();
                // });

                self.addCharacter( character );

                // learn some spells
                character.learnSpell( FireAuraSpell );
                character.learnSpell( FireBulletSpell );
            }
        });

        // A spawning pool
        var pool = new SpawningPool({
            entity: Dog,
            groupOf: 1,
            eachGroupInterval: 30 * 1000
        });
        pool.bind('spawnedone', function(character){
            character.state.team = 1;
            character.learnSpell(BiteSpell);
            character.state.autoAttacks = true;
            character.state.autoAttackSpell = 0;

            character.objective = self.objectives[0];
            character.behaviour = machine.generateTree(MinionBehaviour, character, character.states);
            self.bind('update:behaviours', function () {
                character.behaviour = character.behaviour.tick();
            });
        });
        pool.position.set( self.objectives[1].position.x, self.objectives[1].position.y, self.objectives[1].position.z );
        this.addSpawningPool(pool);
        pool.start();
    };



    Demo.prototype._initGround = function( done ) {

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

                object.scale = new THREE.Vector3(8, 8, 8);
                var interact = new InterativeObject();
                interact.position.set(-99, 15, 94);
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