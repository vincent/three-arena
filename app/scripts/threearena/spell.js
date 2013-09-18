
define('threearena/spell',
    ['lodash', 'threejs'], function(_, THREE) {

    var Spell = function ( options ) {
    	var self = this,
    		options = _.merge({

				isMelee: false,
				meleeLifeDamage: 0,
				magicLifeDamage: 0,
				manaDamage: 0,
				source: null,

                level: 1,
                image: 'default.png'

	    	}, options);

    	_.each(options, function( values, key ){

    		self[ key ] = values;

    	});
    }

    Spell.prototype.canHit = function(source, target) {
        return true;
    };

    Spell.prototype.start = function (caster, target) {
        var self = this;
    }

    return Spell;
});