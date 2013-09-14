
define('threearena/spell/fireaura',
    ['lodash', 'threearena/particles/cloud', 'threearena/spell'], function(_, Particles, Spell) {

    var FireAura = function(options) {

        options = _.merge({}, options, {
            name: 'fireaura'
        })

        Spell.apply(this, [ options ]);

        this.aura = Particles.Aura('circle', 1000, THREE.ImageUtils.loadTexture( "/gamedata/textures/lensflare2.jpg" ), null);

        // character.root.add(character.root.aura.particleCloud);
    };

    FireAura.prototype = new Spell();
    FireAura.prototype.name = 'fireaura';

    ///////////////////

    FireAura.prototype.start = function () {
        aura.start();

        window._ta_events.bind('update', _.bind(function(game){
            aura.update(game.delta);
        }, aura));
    }



    ///////////////////

    FireAura.prototype.constructor = FireAura;
    return FireAura;
});
