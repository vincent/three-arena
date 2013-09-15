
define('threearena/elements/tower',
    ['lodash', 'threejs', 'threearena/particles/cloud', 'threearena/spell', 'threearena/entity'], function(_, THREE, Particles, Spell) {

    var DefenseTower = function( x, y, z, options ) {

        THREE.Object3D.apply( this );

        var self = this,

            x = x ||  0,
            y = y || 28,
            z = z ||  1,
            options = options || {}
            ;

        this.bulletSpeed = options.bulletSpeed || 10;
        this.fireSpeed = options.fireSpeed || 1;

        this.magicLifeDamage = options.magicLifeDamage || 1;
        this.manaDamage = options.magicManaDamage || 1;

        /////

        this._firing = false;
        this._currentTweens = [];

        this.options = _.merge({
                    start: true,
                 minRange: 0,
                 maxRange: 70,
            fireIntensity: 20000,
                transform: function( obj3d ){ return obj3d },
               orbTexture: options.texture || THREE.ImageUtils.loadTexture( "/gamedata/textures/lensflare1_alpha.png" ),
              fireTexture: options.texture || THREE.ImageUtils.loadTexture( "/gamedata/textures/lensflare0_alpha.png" ),
        } , options );

        // self.fireCloud = new ParticleCloud( 10000, self.options.fireTexture );

        var loader = new THREE.ColladaLoader();
        loader.load( '/gamedata/lantern.dae', function ( loaded ) {

            options.transform( loaded );

            self.aura = Particles.Aura( 'point', self.options.fireIntensity, self.options.orbTexture, null );
            self.aura.particleCloud.position.set( x, y, z );
            self.add( self.aura.particleCloud );
            
            var lantern = loaded.scene.children[ 0 ];
            delete loaded;

            self.add(lantern);

            var selfUpdate = _.bind(self.update, self);

            if (self.options.start) {
                self.aura.start();
                
                window._ta_events.bind('update', selfUpdate);
            }
        });
    };
    DefenseTower.prototype = new THREE.Object3D();

    DefenseTower.prototype.update = function(game) {

        var self = this;

        if (this.aura) {
            this.aura.update(game.delta);
        }

        if (this._firing) return;

        var i = -1, charDistance, minDistance = Number.MAX_VALUE, nearest = false;
        while (i++ < game.pcs.length - 1 && !this._firing) {
            charDistance = game.pcs[i].position.distanceTo(self.position);
            if (charDistance >= self.options.minRange && charDistance < self.options.maxRange 
                && charDistance < minDistance) {
                nearest = i;
                minDistance = charDistance;
            }
        }
        nearest !== false && ! this._firing && self.fireTo( game.pcs[ nearest ] );
    };

    DefenseTower.prototype.stopFiring = function( target ) {
        this._firing = false;
    };

    DefenseTower.prototype.fireTo = function(target) {

        if (this._firing || ! target instanceof Entity) return;
        this._firing = true;
        
        var startPosition = this.position.clone().setY(25);
        var vectorPosition = target.position.clone().add(startPosition).divideScalar(2).setY(28 + 0);

        var self = this,
            line = new THREE.SplineCurve3([ startPosition, vectorPosition, target.position ]),
            cloud = new Particles.ParticleCloud( 10000, self.options.fireTexture, null, {
                colorHSL: .5
            }),
            cloudUpdate = _.bind(function(game){
                cloud.update(game.delta);
            }, cloud)
            ;

        var tween = new TWEEN.Tween({ distance: 0 })

            .to({ distance: 1 }, line.getLength() * self.bulletSpeed) // use 

            .easing(TWEEN.Easing.Linear.None)

            .onStart(function(){
                window._ta_events.bind('update', cloudUpdate);

                self.add(cloud.particleCloud);
                cloud.start();

                setTimeout(function(){
                    self._firing = false;

                }, 4000 / self.fireSpeed);

                setTimeout(function(){
                    if (tween) { tween.stop(); }
                    window._ta_events.unbind('update', cloudUpdate);

                    self.remove(cloud.particleCloud);
                }, 1000 );
            })
            
            .onComplete(function(){
                window._ta_events.unbind('update', cloudUpdate);

                self.remove(cloud.particleCloud);
                cloud.stop();
                // self._firing = false;
                delete cloud;

                var spell = new Spell({
                    name: 'firebullet',
                    source: self,
                    magicLifeDamage: self.magicLifeDamage,
                    manaDamage: self.manaDamage,
                });
                target.hit(spell);
            })
            
            .onUpdate(function(){
                // get the position data half way along the path
                var pathPosition = line.getPoint(this.distance);

                // move to that position
                cloud.particleCloud.position.set(pathPosition.x * .9, pathPosition.y * .9, pathPosition.z * .9);
                // cloud.emitterpos.set(pathPosition.x * 0.01, pathPosition.y * 0.01, pathPosition.z * 0.01);

                // cloud.emitterpos.set(pathPosition.x, pathPosition.y, pathPosition.z);

                cloud.particleCloud.updateMatrix();
            })
            .start();
    };

    DefenseTower.prototype.constructor = THREE.DefenseTower;

    return DefenseTower;

});
