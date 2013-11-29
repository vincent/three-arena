
define('threearena/spell/fireaura',
    ['lodash', 'threearena/particles/cloud', 'threearena/spell'], function(_, Particles, Spell) {

    /**
     * @exports threearena/spell/fireaura
     */
    var FireAura = function(options) {

        options = _.merge({}, options, {
            name: 'fireaura',
            cooldown: 20 * 1000
        })

        Spell.apply(this, [ options ]);

        this.aura = Particles.Aura('circle', 1000, THREE.ImageUtils.loadTexture( "/gamedata/textures/lensflare1_alpha.png" ), null);

        // character.root.add(character.root.aura.particleCloud);
    };

    FireAura.prototype = new Spell();
    FireAura.prototype.name = 'fireaura';

    ///////////////////

    FireAura.prototype.start = function (caster, target) {
        var self = this;

        var updateCloud = _.bind(function(game){
            self.aura.update(game.delta);
        }, self);

        caster.character.root.add(this.aura.particleCloud);

        self.startCooldown(caster);

        this.aura.start();
        window._ta_events.bind('update', updateCloud);

        setTimeout(function(){
            self.aura.stop();
            caster.character.root.remove(self.aura.particleCloud);
            window._ta_events.unbind('update', updateCloud);
        }, 5000);

    }



    ///////////////////

    FireAura.prototype.constructor = FireAura;
    return FireAura;
});
