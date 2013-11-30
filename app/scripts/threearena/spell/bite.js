
define('threearena/spell/bite',
    ['lodash', 'threearena/spell'], function(_, Spell) {

    /**
     * @exports threearena/spell/bite
     */
    var Bite = function(options) {

        options = _.merge({}, options, {
            name: 'bite',
            isMelee: true,
            meleeLifeDamage: 10,

            minRange: 1,
            maxRange: 4,
        })

        [6,4,5,5,0,0,3,6]

        Spell.apply(this, [ options ]);
    };

    Bite.prototype = new Spell();
    Bite.prototype.name = 'bite';

    ///////////////////

    Bite.prototype.canHit = function(source, target, toleranceRatio) {
        toleranceRatio = toleranceRatio || 1;
        return source !== target && source.position.distanceTo(target.position) - target.state.attackRange < (this.maxRange * toleranceRatio);
    };

    Bite.prototype.start = function(source, target) {
        this.source = source;
        target.hit(this);
    };

    ///////////////////

    Bite.prototype.constructor = Bite;
    return Bite;
});
