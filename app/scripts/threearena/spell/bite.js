
define('threearena/spell/bite',
    ['lodash', 'threearena/spell'], function(_, Spell) {

    var Bite = function(options) {

        options = _.merge({}, options, {
            name: 'bite',
            isMelee: true,
            meleeLifeDamage: 10,

            level: 1,
            image: 'default.png'
        })

        Spell.apply(this, [ options ]);
    };

    Bite.prototype = new Spell();
    Bite.prototype.name = 'bite';

    ///////////////////

    Bite.prototype.canHit = function(source, target) {
        return source.position.distanceTo(target.position) < 5;
    };

    Bite.prototype.start = function(source, target) {
        this.source = source;
        target.hit(this);
    };

    ///////////////////

    Bite.prototype.constructor = Bite;
    return Bite;
});
