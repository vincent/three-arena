
/**
 * @module Character/Monsterdog
 */
define('threearena/character/monsterdog',
    ['lodash', 'threejs', 'threearena/log', 'threearena/character'], function(_, THREE, log, Character) {

    var Monsterdog = function( options ) {

        var self = this;

        options = _.merge({

            life: 100,
            mana: false,

            name: 'Monsterdog',
            image: '/gamedata/models/monster/portrait.gif',

            onLoad: null,

        }, options);

        Character.apply( this, [ options ]);

		var loader = new THREE.ColladaLoader();
		loader.options.convertUpAxis = true;
		loader.load( '/gamedata/models/monster/monster.dae', function ( collada ) {

			self.character = collada.scene;
			self.skin = collada.skins[ 0 ];

			self.character.rotation.y = 65 * Math.PI / 2;
			self.character.scale.x = self.character.scale.y = self.character.scale.z = 0.005;
			self.character.updateMatrix();

			self.character.controls = {};
			self.character.setAnimation = function (anim) { };

			var t = 0;
			self.character.update = function(delta) {
				if ( t > 1 ) t = 0;

				// guess this can be done smarter...
				// (Indeed, there are way more frames than needed and interpolation is not used at all
				//  could be something like - one morph per each skinning pose keyframe, or even less,
				//  animation could be resampled, morphing interpolation handles sparse keyframes quite well.
				//  Simple animation cycles like this look ok with 10-15 frames instead of 100 ;)

				for ( var i = 0; i < self.skin.morphTargetInfluences.length; i++ ) {
					self.skin.morphTargetInfluences[ i ] = 0;
				}

				self.skin.morphTargetInfluences[ Math.floor( t * 30 ) ] = 1;

				t += delta;
			};

			setTimeout(function(){
				self.add(self.character);
				options.onLoad && options.onLoad.apply(self);
			}, 100);
		} );
    };

    Monsterdog.prototype = new Character();

    ////////////////

    ////////////////

    Monsterdog.prototype.constructor = Monsterdog;

    return Monsterdog;
});
