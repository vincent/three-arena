
define('threearena/spell/lightbolt',
    ['lodash', 'threearena/spell', 'threearena/utils', 'threearena/shaders/lightbolt'], function(_, Spell, Utils, LightboltMaterial) {

    /**
     * @exports threearena/spell/lightbolt
     */
    var Lightbolt = function(options) {

        options = _.merge({}, options, {

            name: 'lightbolt',

            isMelee: false,
            magicLifeDamage: 20,

            level: 1,

            needsTarget: false
        })

        Spell.apply(this, [ options ]);

        this.shaderMaterial = new LightboltMaterial();

        // we need an oriented mesh like this:
        //   _____________
        //  |             |
        //  ° 0,0         |
        //  |_____________|
        //  
        //   ______________
        //  |      °      |
        //  |      0,0    |
        //  |             |
        //  |             |
        //  |             |
        //  |_____________|
        //  

		var geometry = new THREE.PlaneGeometry( 1, 10 );
		for (var i = 0; i < geometry.vertices.length; i++) {
			geometry.vertices[i].x += .5;
			//geometry.vertices[i].y += 5;
		}

        this.plane = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial( [ this.shaderMaterial, this.shaderMaterial ] ) );
        //this.plane.rotation.x = 90 * Math.PI / 180;
        // this.plane.position.y *= - .5;
        // this.plane.position.x *= - .5;
        this.plane.position.y += 2;
    };

    Lightbolt.prototype = Object.create(Spell.prototype);

    Lightbolt.prototype.name = 'lightbolt';

    ///////////////////

    Lightbolt.prototype.canHit = function(source, target, toleranceRatio) {
        toleranceRatio = toleranceRatio || 1;
        return source.position.distanceTo(target.position) < (50 * toleranceRatio);
    };

    Lightbolt.prototype.start = function (caster, target) {
        var self = this;
        //self.plane.position.set( caster.position.x, caster.position.y + 5, caster.position.z );

        var update = function(game){
            self.shaderMaterial.uniforms.time.value += game.delta; // * 100 * Math.PI / 180;
        };


        self.tween = new TWEEN.Tween(self.plane.scale)
            .to({ x: 30, y: 3 }, 300) // use 
            .easing( TWEEN.Easing.Elastic.InOut )
            .onStart(function(){
		        window._ta_events.bind('update', update);
            	caster.character.root.add(self.plane);
            	caster.character.meshes.push(self.plane);
            	//self.plane.position = startPosition;
            })
            .onComplete(function(){
            	window._ta_events.unbind('update', update);
            	self.plane.scale.set( 1, 1, 1 );
                caster.character.root.remove(self.plane);
                // hit, eventually
                // target.hit(self);
            })
            .onUpdate(function(){
            })
            .start();
    };

    ///////////////////

    Lightbolt.prototype.constructor = Lightbolt;
    return Lightbolt;
});
