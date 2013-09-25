
define('threearena/spell/firebullet',
    ['lodash', 'threearena/particles/cloud', 'threearena/spell', 'threearena/utils'], function(_, Particles, Spell, Utils) {

    var FireBullet = function(options) {

        options = _.merge({}, options, {
            name: 'firebullet',
            needsTarget: true
        })

        Spell.apply(this, [ options ]);

        this.aura = Particles.Aura('point', 500, THREE.ImageUtils.loadTexture( "/gamedata/textures/lensflare0_alpha.png" ), null);
    };

    FireBullet.prototype = new Spell();
    FireBullet.prototype.name = 'firebullet';

    ///////////////////

    FireBullet.prototype.canHit = function(source, target, toleranceRatio) {
        toleranceRatio = toleranceRatio || 1;
        return source.position.distanceTo(target.position) < (40 * toleranceRatio);
    };

    FireBullet.prototype.start = function (caster, target) {
        var self = this;

        var updateCloud = _.bind(function(game){
            self.aura.update(game.delta);
        }, self);

        var endPosition = target.position.clone().sub(caster.position);
                                                    // FIXME: start_position should be just in front of character
        Utils.moveAlong(this.aura.particleCloud, [ new THREE.Vector3(0, 5, 0), endPosition ], {
            speed: 6,
            onStart: function(){
                caster.add(self.aura.particleCloud);
                self.aura.start();
                window._ta_events.bind('update', updateCloud);
            },
            onComplete: function(){
                self.aura.stop();
                self.aura.reset();
                caster.remove(self.aura.particleCloud);
                window._ta_events.unbind('update', updateCloud);

                target.hit(self);
            },
            onUpdate: function(){

            },
        });
    }



    ///////////////////

    FireBullet.prototype.constructor = FireBullet;
    return FireBullet;
});
