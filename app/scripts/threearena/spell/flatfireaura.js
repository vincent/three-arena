
define('threearena/spell/flatfireaura',
    ['lodash', 'threearena/particles/cloud', 'threearena/spell'], function(_, Particles, Spell) {

    /**
     * @exports threearena/spell/flatfireaura
     */
    var FlatFireAura = function(options) {

        options = _.merge({}, options, {
            name: 'fireaura'
        })

        Spell.apply(this, [ options ]);

        var texture = THREE.ImageUtils.loadTexture( "/gamedata/textures/summoning_circles/circle4.bold.png" );

        /* * /
        var material = new THREE.SpriteMaterial( { map: texture, useScreenCoordinates: false, color: 0xdd0202, transparent: true } );
        this.aura = new THREE.Sprite( material );
        this.aura.rotation.x = 90 * Math.PI / 180;
        this.aura.scale.set( 30, 30, 1.0 ); // imageWidth, imageHeight
        /* */

        /* */
        texture.needsUpdate = true;

        var geometry = new THREE.PlaneGeometry(30, 30, 1, 1);
        var material = new THREE.MeshBasicMaterial({
            color: 0xdd0202,
            transparent: true,
            map: texture,
            blending: THREE.AdditiveBlending,
        });

        this.aura = new THREE.Mesh( geometry, material );
        this.aura.position.y = 1;
        this.aura.rotation.x = - 90 * Math.PI / 180;
        this.aura.receiveShadow = true;
        /* */

    };

    FlatFireAura.prototype = new Spell();
    FlatFireAura.prototype.name = 'fireaura';

    ///////////////////

    FlatFireAura.prototype.start = function (caster, target) {
        var self = this;

        var update = _.bind(function(game){
            this.aura.rotation.z += game.delta; // * 100 * Math.PI / 180;
        }, self);

        caster.add(this.aura);
        window._ta_events.bind('update', update);

        setTimeout(function(){
            caster.remove(self.aura);
            window._ta_events.unbind('update', update);
        }, 5000);
    };

    ///////////////////

    FlatFireAura.prototype.constructor = FlatFireAura;
    return FlatFireAura;
});
