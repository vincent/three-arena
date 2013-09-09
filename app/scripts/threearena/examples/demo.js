
define('threearena/examples/demo',
    ['lodash', 'threejs', '../game', '../particles/cloud'], function(_, THREE, Game, Particles){
    'use strict';

	var Demo = function() {

		var settings = {

            container: document.getElementById('game-container'),

            positions: {
                spawn: new THREE.Vector3( 0, 0, 0 ),
                origin: new THREE.Vector3( 0, 0, 0 ),
                maporigin: new THREE.Vector3( -142, 0, 139 ),
                neartower: new THREE.Vector3(  -51, 0, 62 )
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
        this.addCharacter( this.ogro() );
    };


	Demo.prototype.ogro = function() {
        // Agent
        var self = this,
            configOgro = {
                baseUrl: "/gamedata/models/ogro/",
                body: "ogro-light.js",
                skins: [
                    // "grok.jpg",
                    // "ogrobase.png",
                    // "arboshak.png",
                    // "ctf_r.png",
                    // "ctf_b.png",
                    // "darkam.png",
                    // "freedom.png",
                    // "gib.png",
                    // "gordogh.png",
                    // "igdosh.png",
                    // "khorne.png",
                    // "nabogro.png",
                    "sharokh.png"
                ],
                weapons:  [ [ "weapon-light.js", "weapon.jpg" ] ],
                animations: {
                    move: "run",
                    idle: "stand",
                    jump: "jump",
                    attack: "attack",
                    crouchMove: "cwalk",
                    crouchIdle: "cstand",
                    crouchAttach: "crattack"
                },
                walkSpeed: 350,
                crouchSpeed: 175
            };

        var nRows = 1;
        var nSkins = configOgro.skins.length;

        var character = new THREE.MD2CharacterComplex();
        character.scale = .3;
        character.controls = {
            moveForward: false,
            moveBackward: false,
            moveLeft: false,
            moveRight: false
        };

        character.root.aura = Particles.Aura('circle', 1000, THREE.ImageUtils.loadTexture( "/gamedata/textures/lensflare2.jpg" ), null);
        character.root.add(character.root.aura.particleCloud);
        character.root.aura.start();
        window.addEventListener( 'render-update', _.bind( function(event){
        	character.root.aura.update( event.detail.delta );
        }, character.root.aura ) );

        var baseCharacter = new THREE.MD2CharacterComplex();
        baseCharacter.scale = 1;

        baseCharacter.onLoadComplete = function () {
            character.shareParts( baseCharacter );
            //character.enableShadows( true );

            // disable speed
            character.maxSpeed = 
            character.maxReverseSpeed = 
            character.frontAcceleration = 
            character.backAcceleration = 
            character.frontDecceleration = 
            character.angularSpeed = 0;
            character.setWeapon( 0 );
            character.setSkin( 0 );

            character.root.position.x = 0;
            character.root.position.y = 0;
            character.root.position.z = 0;
            character.root.position.set( self.settings.positions.spawn.x, 0, self.settings.positions.spawn.z );

            //character.root.castShadow = true;
        };

        baseCharacter.loadParts( configOgro );

        return character;
    };

    return Demo;
});