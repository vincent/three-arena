
define('threearena/examples/demo',
    ['lodash', 'threejs', 'threearena/game', 'threearena/utils',
      'threearena/character/ogro', 'threearena/character/007', 'threearena/character/monsterdog', 'threearena/character/human',

      'threearena/elements/terrain',
      'threearena/elements/interactiveobject',
      'threearena/elements/autospawn',
      'threearena/elements/water',
      'threearena/elements/shop',
      'threearena/elements/nexus',

      'threearena/spell/bite',
      'threearena/spell/fireaura',
      'threearena/spell/flatfireaura',
      'threearena/spell/firebullet',
      'threearena/spell/lightbolt',

      'threearena/particles/cloud',
      'threearena/particles/flies',

      'machinejs',
      'threearena/behaviours/minion',
      'threearena/behaviours/controlled'
    ],

    function(_, THREE, Game, Utils, Ogro, OO7, Dog, Human, Terrain, InterativeObject, SpawningPool, Water, Shop, Nexus, BiteSpell, FireAuraSpell, FlatFireAuraSpell, FireBulletSpell, LightboltSpell, Particles, Flies, Machine, MinionBehaviour, ControlledBehaviour) {
    'use strict';

    /**
     * @exports threearena/examples/demo
     */
	var Demo = new Game({

        container: document.getElementById('game-container'),
        splashContainer: document.getElementById('splash-container'),

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
                'cacheonly!/gamedata/dota_map_full_compress3.jpg',
                'cacheonly!/gamedata/textures/lensflare1_alpha.png',
                'cacheonly!/gamedata/textures/lensflare0_alpha.png',
                'cacheonly!/gamedata/textures/lantern_1024_c.png',
                'cacheonly!/gamedata/oak-branch-c.png',
                'cacheonly!/gamedata/leaf-mapple-yellow-c.png',
                'cacheonly!/gamedata/oak-branch-c.png'
            ]
        }
	});


    Demo.setTerrain('/gamedata/maps/mountains.obj', {
        tDiffuse: '/gamedata/dota_map_full_compress3.jpg',
        tNormal: '/gamedata/textures/plain_blue.png',
        // tSpecular: '/gamedata/dota_map_full_compress3.jpg'        
    });


    var objective1, objective2;
    Demo.addStatic(function(done){
        objective1 = new Nexus({ life: 1000000, color: '#F33' });
        objective1.position.set(-71.2, 19, 69);
        // Demo.intersectObjects.push(objective1);
        done(objective1);

        objective2 = new Nexus({ life: 1000000, color: '#3F3' });
        objective2.position.set(89.2, 21, -62.5);
        // Demo.intersectObjects.push(objective2);
        done(objective2);
    });


    // A shop
    var shop = new Shop({
        menu: {
            items: [
                { action: 'sell', name: 'Potion', price: 20 }
            ]
        }
    });
    shop.position.set( -99, 15, 94 );
    Demo.addInteractive(shop);


    // A lamp
    Demo.addStatic(function (done) {
        var loader = new THREE.OBJMTLLoader();
        loader.addEventListener('load', function (event) {
            var object = event.content;
            //object.position.set(-151, 0, 122);
            object.position.set(-70, 17, 60);
            object.children[0].scale.set(0.05, 0.05, 0.05);

            var aura = Particles.Aura('point', 100, THREE.ImageUtils.loadTexture('/gamedata/textures/lensflare1_alpha.png'));
            aura.particleCloud.position.set(1, 12, 5);
            object.add(aura.particleCloud);
            aura.start();

            window._ta_events.bind('update', function(game){
                aura.update(game.delta);
            });

            done(object);
        });
        loader.load('/gamedata/models/lightning_pole/lightning_pole.obj', '/gamedata/models/lightning_pole/lightning_pole.mtl');
    });


    // Some flies
    Demo.bind('set:terrain', function(){
        Demo.addStatic(function (done) {
            var flies = new Flies(10);
            flies.position = Demo.randomPositionOnterrain();
            Demo.bind('update', _.bind(flies.update, flies));
            done(flies);
        });
    });


    // A state Machine 
    var machine = new Machine();        


    // Another character
    Demo.addCharacter(function(done){
        var ogro = new OO7({
            onLoad: function(){
                var character = this;

                character.state.team = 0;

                character.behaviour = machine.generateTree(ControlledBehaviour, character, character.states);
                Demo.bind('update:behaviours', function () {
                    // character.behaviour = character.behaviour.tick();
                });

                // learn some spells
                character.learnSpell( FireAuraSpell );
                character.learnSpell( FireBulletSpell );
                character.learnSpell( FlatFireAuraSpell );
                character.learnSpell( LightboltSpell );

                character.position.copy(Demo.settings.positions.nearcamp);

                Demo.asPlayer(character);

                done(character);
            }
        });
    });

    // A spawning pool
    var pool = new SpawningPool({
        entity: Dog,
        groupOf: 1,
        eachGroupInterval: 30 * 1000
    });
    pool.bind('spawnedone', function (character) {
        character.state.team = 1;
        character.learnSpell(BiteSpell);
        character.state.autoAttacks = true;
        character.state.autoAttackSpell = 0;

        character.objective = objective1;
        character.behaviour = machine.generateTree(MinionBehaviour, character, character.states);
        Demo.bind('update:behaviours', function() {
            character.behaviour = character.behaviour.tick();
        });
    });
    pool.position.copy(objective2.position);
    Demo.bind('start', function () {
        pool.start();
    });
    Demo.addSpawningPool(pool);

    return Demo;
});