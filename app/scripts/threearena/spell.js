
define('threearena/spell',
    ['lodash', 'threejs'], function(_, THREE) {

    /**
     * A spell
     * 
     * @exports threearena/spell
     * @constructor
     * @param {Object} options
     */
    var Spell = function ( options ) {
    	var self = this,
    		options = _.merge({

				isMelee: false,
				meleeLifeDamage: 0,
				magicLifeDamage: 0,
				manaDamage: 0,
				source: null,

                minRange: 1,
                maxRange: 2,

                level: 1,
                image: 'default.png'

	    	}, options);

    	_.each(options, function( values, key ){

    		self[ key ] = values;

    	});
    }

    /**
     * Return `true` if this spell can hit the specified target
     * @param  {Entity} source         The caster entity
     * @param  {Entity} target         The target entity
     * @param  {Number} toleranceRatio acceptable distance ratio
     * @return {Boolean}               `true` if this spell can hit the specified target      
     */
    Spell.prototype.canHit = function(source, target, toleranceRatio) {
        return false;
    };

    /**
     * Start the spell against the specified target
     * @param  {Entity} source         The caster entity
     * @param  {Entity} target         The target entity
     */
    Spell.prototype.start = function (source, target) {
        var self = this;
    }

    return Spell;
});