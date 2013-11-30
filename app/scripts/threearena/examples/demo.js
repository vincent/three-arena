
define('threearena/examples/demo',
    ['lodash', 'threejs', 'threearena/game', 'threearena/utils',
      'threearena/character/ogro', 'threearena/character/ratamahatta', 'threearena/character/monsterdog', 'threearena/character/human',

      'threearena/elements/terrain',
      'threearena/elements/interactiveobject',
      'threearena/elements/autospawn',
      'threearena/elements/water',
      'threearena/elements/shop',

      'threearena/spell/bite',
      'threearena/spell/fireaura',
      'threearena/spell/flatfireaura',
      'threearena/spell/firebullet',
      'threearena/spell/lightbolt',

      'threearena/particles/flies',

      'machinejs',
      'threearena/behaviours/minion',
      'threearena/behaviours/controlled'
    ],

    function(_, THREE, Game, Utils, Ogro, Ratamahatta, Dog, Human, Terrain, InterativeObject, SpawningPool, Water, Shop, BiteSpell, FireAuraSpell, FlatFireAuraSpell, FireBulletSpell, LightboltSpell, Flies, Machine, MinionBehaviour, ControlledBehaviour) {
    'use strict';

    /**
     * @exports threearena/examples/demo
     */
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

			preload: {
                // The keys act as labels for the listing of currently loading packages.
                "Import models": [
                    'cacheonly!/gamedata/maps/mountains.obj',
                    'cacheonly!/gamedata/maps/mountains_trees.obj',
                    'cacheonly!/gamedata/models/marketplace.obj',
                    'cacheonly!/gamedata/tree_pine.dae',
                    'cacheonly!/gamedata/tree_oak.dae',
                    'cacheonly!/gamedata/lantern.dae'
                ],
                "Import textures": [
                    'cacheonly!/gamedata/dota_map_full_compress2_normals.jpg',
                    'cacheonly!/gamedata/dota_map_full_compress2_specular.jpg',
                    'cacheonly!/gamedata/dota_map_full_compress2.jpg',
                    'cacheonly!/gamedata/dota_map_full_compress3.jpg',
                    'cacheonly!/gamedata/textures/lensflare1_alpha.png',
                    'cacheonly!/gamedata/textures/lensflare0_alpha.png',
                    'cacheonly!/gamedata/textures/lantern_1024_c.png',
                    'cacheonly!/gamedata/Bark_Tile.jpg',
                    'cacheonly!/gamedata/oak-branch-c.png',
                    'cacheonly!/gamedata/Bark_Tile.jpg',
                    'cacheonly!/gamedata/leaf-mapple-yellow-c.png',
                    'cacheonly!/gamedata/oak-branch-c.png'
                ]
            }
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

                character.behaviour = machine.generateTree(ControlledBehaviour, character, character.states);
                self.bind('update:behaviours', function () {
                    character.behaviour = character.behaviour.tick();
                });

                self.addCharacter( character );

                // learn some spells
                character.learnSpell( FireAuraSpell );
                character.learnSpell( FireBulletSpell );
                character.learnSpell( FlatFireAuraSpell );
                character.learnSpell( LightboltSpell );

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

        new Terrain({
            onLoad: function(terrain) {
                self.ground = terrain;
                self.intersectObjects = self.intersectObjects.concat(self.ground.children[0].children);
                self.scene.add( self.ground );

                // A shop
                var shop = new Shop({
                    menu: { items: [
                        { action: 'sell', name: 'Potion', price: 20 }
                    ] }
                });
                shop.position.set( -99, 15, 94 );
                self.intersectObjects.push( shop );
                self.scene.add( shop );

                done();
            }
        });
    };

    return Demo;
});