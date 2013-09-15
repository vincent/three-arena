define('threearena/character/ratamahatta',
    ['lodash', 'threejs', 'threearena/log', 'threearena/character'], function(_, THREE, log, Character) {

    var Ratamahatta = function( options ) {

        var self = this;

        options = _.merge({

            life: 100,
            mana: false,

            name: 'Ratamahatta',
            image: '/gamedata/models/ogro/portrait.gif',

            modelOptions: {
				baseUrl: "/gamedata/models/ratamahatta/",

				body: "ratamahatta.js",
				skins: [ "ratamahatta.png", "ctf_b.png", "ctf_r.png", "dead.png", "gearwhore.png" ],
				weapons:  [
					[ "weapon.js", "weapon.png" ],
					[ "w_bfg.js", "w_bfg.png" ],
					[ "w_blaster.js", "w_blaster.png" ],
					[ "w_chaingun.js", "w_chaingun.png" ],
					[ "w_glauncher.js", "w_glauncher.png" ],
					[ "w_hyperblaster.js", "w_hyperblaster.png" ],
					[ "w_machinegun.js", "w_machinegun.png" ],
					[ "w_railgun.js", "w_railgun.png" ],
					[ "w_rlauncher.js", "w_rlauncher.png" ],
					[ "w_shotgun.js", "w_shotgun.png" ],
					[ "w_sshotgun.js", "w_sshotgun.png" ]
				],
            },

            onLoad: null,

        }, options);

        Character.apply( this, [ options ]);

		this.character = new THREE.MD2Character();

        this.character.scale = .14;
        this.character.controls = {
            moveForward: false,
            moveBackward: false,
            moveLeft: false,
            moveRight: false
        };


		this.character.onLoadComplete = function() {

			//self.setupSkinsGUI( self.character );
			//self.setupWeaponsGUI( self.character );
			//self.setupGUIAnimations( self.character );

			self.add(self.character.root);

			options.onLoad && options.onLoad.apply(self);
		};

		this.character.loadParts( options.modelOptions );


        // this.character = new THREE.MD2CharacterComplex();
        // this.character.scale = .3;
        // this.character.controls = {
        //     moveForward: false,
        //     moveBackward: false,
        //     moveLeft: false,
        //     moveRight: false
        // };

        // var baseCharacter = new THREE.MD2CharacterComplex();
        // baseCharacter.scale = 1;

        // baseCharacter.onLoadComplete = function () {
        //     self.character.shareParts( baseCharacter );
        //     //self.character.enableShadows( true );

        //     // disable speed
        //     self.character.maxSpeed = 
        //     self.character.maxReverseSpeed = 
        //     self.character.frontAcceleration = 
        //     self.character.backAcceleration = 
        //     self.character.frontDecceleration = 
        //     self.character.angularSpeed = 0;
        //     self.character.setWeapon( 0 );
        //     self.character.setSkin( 0 );

        //     self.character.root.position.set(0, 0, 0);

        //     self.character.meshBody.position.y = 5;
        //     self.character.meshWeapon.position.y = 5;

        //     //self.character.root.castShadow = true;

        //     self.add(self.character.root);
        // };

        // baseCharacter.loadParts( options.modelOptions );
    };

    Ratamahatta.prototype = new Character();

    ////////////////

	Ratamahatta.prototype.setupWeaponsGUI = function( character ) {

		var folder = gui.addFolder( "Weapons" );

		var generateCallback = function( index ) {

			return function () { character.setWeapon( index ); };

		}

		var guiItems = [];

		for ( var i = 0; i < character.weapons.length; i ++ ) {

			var name = character.weapons[ i ].name;

			playbackConfig[ name ] = generateCallback( i );
			guiItems[ i ] = folder.add( playbackConfig, name ).name( labelize( name ) );

		}

	};

	//

	Ratamahatta.prototype.setupSkinsGUI = function( character ) {

		var folder = gui.addFolder( "Skins" );

		var generateCallback = function( index ) {

			return function () { character.setSkin( index ); };

		}

		var guiItems = [];

		for ( var i = 0; i < character.skinsBody.length; i ++ ) {

			var name = character.skinsBody[ i ].name;

			playbackConfig[ name ] = generateCallback( i );
			guiItems[ i ] = folder.add( playbackConfig, name ).name( labelize( name ) );

		}

	}

	//

	Ratamahatta.prototype.setupGUIAnimations = function( character ) {

		var folder = gui.addFolder( "Animations" );

		var generateCallback = function( animationName ) {

			return function () { character.setAnimation( animationName ); };

		}

		var i = 0, guiItems = [];
		var animations = character.meshBody.geometry.animations;

		for ( var a in animations ) {

			playbackConfig[ a ] = generateCallback( a );
			guiItems[ i ] = folder.add( playbackConfig, a, a );

			i ++;

		}

	}
    

    ////////////////

    Ratamahatta.prototype.constructor = Ratamahatta;

    return Ratamahatta;
});
