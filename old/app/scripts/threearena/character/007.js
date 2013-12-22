define('threearena/character/007',
    ['lodash', 'threejs', 'threearena/log', 'threearena/character'], function(_, THREE, log, Character) {

    /**
     * @exports threearena/character/007
     * 
     * @constructor
     * 
     * @param {Object} options options
     * @param {object=} options.name Character name
     * @param {object=} options.image Path to character portrait
     * @param {object=} options.life Character Base life
     * @param {object=} options.mana Character Base mana
     * 
     * @extends {module:threearena/entity}
     */
    var ZeroZeroSeven = function( options ) {

        var self = this;

        options = _.merge({

            life: 100,
            mana: false,

            name: 'ZeroZeroSeven',
            image: '/gamedata/models/007/portrait.gif',

            modelOptions: {
                baseUrl: '/gamedata/models/007/',
                body: '007.js',
                skins: [
                    '007base.png'
                ],
                weapons:  [ [ 'weapon.js', 'weapon.png' ] ],
                animations: {
                    move: 'run',
                    idle: 'stand',
                    jump: 'jump',
                    pain: 'pain',
                    death: 'death',
                    attack: 'attack',
                    crouchMove: 'cwalk',
                    crouchIdle: 'cstand',
                    crouchAttach: 'crattack'
                },
                walkSpeed: 300,
                crouchSpeed: 175
            },

            onLoad: null,

        }, options);

        Character.apply( this, [ options ]);

        this.character = new THREE.MD2CharacterComplex();
        this.character.scale = .25;
        this.character.controls = {
            moveForward: false,
            moveBackward: false,
            moveLeft: false,
            moveRight: false
        };

        var baseCharacter = new THREE.MD2CharacterComplex();
        baseCharacter.scale = 1;

        baseCharacter.onLoadComplete = function () {
            self.character.shareParts( baseCharacter );
            self.character.enableShadows( true );

            // disable speed
            self.character.maxSpeed = 
            self.character.maxReverseSpeed = 
            self.character.frontAcceleration = 
            self.character.backAcceleration = 
            self.character.frontDecceleration = 
            self.character.angularSpeed = 0;
            self.character.setWeapon( 0 );
            self.character.setSkin( 0 );

            self.character.root.position.set(0, 0, 0);

            self.character.meshBody.position.y = 2;
            self.character.meshWeapon.position.y = 2;

            self.character.meshBody.rotation.y = 180 * Math.PI / 180;
            self.character.meshWeapon.rotation.y = 180 * Math.PI / 180;

            //self.character.root.castShadow = true;
            //self.rotation.y = 4.3;

            self.add(self.character.root);

            options.onLoad && options.onLoad.apply(self);
        };

        baseCharacter.loadParts( options.modelOptions );
    };

    ZeroZeroSeven.prototype = Object.create(Character.prototype);

    ////////////////

    

    ////////////////

    ZeroZeroSeven.prototype.constructor = ZeroZeroSeven;

    return ZeroZeroSeven;
});
