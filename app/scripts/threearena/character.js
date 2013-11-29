define('threearena/character',
    ['lodash', 'threejs', 'threearena/log', 'threearena/utils', 'threearena/entity'], function(_, THREE, log, Utils, Entity) {

   /** 
    * A module representing a character.
    * @exports threearena/character
    */
   var Character = function(options) {

        var self = this;

    /*

    Strength is a measure of a Hero's toughness and endurance. Strength determines a Hero's maximum health and health regeneration. Heroes with strength as their primary attribute can be hard to kill, so they will often take initiator and tank roles, initiating fights and taking most of the damage from enemy attacks.
    Every point in strength increases maximum health by 19.
    Every point in strength increases health regeneration by 0.03 HP per second.
    If strength is a Hero's primary attribute, every point in strength increases his or her attack damage by 1.

    Agility is a measure of a Hero's swiftness and dexterity. Agility determines a Hero's armor and attack speed. Heroes with agility as their primary attribute tend to be more dependent on their auto-attacks and items, and are usually capable of falling back on their abilities in a pinch. Agility Heroes often take carry and Gank roles.
    Every 7 points in agility increases a Hero's armor by 1.
    Every point in agility increases a Hero's attack speed by 1.
    If agility is a Hero's primary attribute, every point in agility increases his or her attack damage by 1.

    Intelligence
    Intelligence is a measure of a Hero's wit and wisdom. Intelligence determines a Hero's maximum mana and mana regeneration. Heroes with intelligence as their primary attribute tend to rely on their abilities to deal damage or help others. Intelligence Heroes often take support, gank, and pusher roles.
    Every point in intelligence increases a Hero's maximum Mana by 13.
    Every point in intelligence increases a Hero's mana regeneration by 0.04 mana per second.
    If intelligence is a Hero's primary attribute, every point in intelligence increases his or her attack damage by 1.

    */


        Entity.apply(this, [ options ]);

        var loader = new THREE.ColladaLoader();
        loader.load( '/gamedata/models/rts_elements.dae', function ( loaded ) {

            self.tomb = loaded.scene.getObjectByName('Cross2');

            self.tomb.castShadow = true;
            self.tomb.rotation.x = -90 * Math.PI / 180;
            self.tomb.scale.set(2, 2, 2);
            self.tomb.position.set(0, 0, 0);

            // when character die, show just a tomb
            self.bind('death', function(){
                self.update = function(){};

                for (var i = 0; i < self.children.length; i++) {
                    self.remove(self.children[i]);
                }

                self.add(self.tomb);
            });
        });
    };

    Character.prototype = Object.create(Entity.prototype);

    ////////////////

    Character.prototype.update = function(game) {

        this.character.update(game.delta);
    };

    /**
     * Make the character move along a path
     * @param  {Array|THREE.Shape} linepoints the shape or the points the character will walk along
     * @param  {Object} options { start onStart onComplete onUpdate}
     * @return {Tween} the Tween.js object
     */
    Character.prototype.moveAlong = function(linepoints, options) {

        var self = this;
        
        options = _.merge({
            append: false,
            speed: this.state.speed,
            onStart: function(){
                self.character.controls.moveForward = true;
                self.character.setAnimation('run');
            },
            onComplete: function(){
                self.character.controls.moveForward = false;
                self.character.setAnimation('stand');
            },
            onUpdate: function(tween, shape) {
                if (self.character.activeAnimation !== 'run') {
                    self.character.setAnimation('run');
                }

                // get the orientation angle quarter way along the path
                var tangent = shape.getTangent(tween.distance);
                var angle = Math.atan2(-tangent.z, tangent.x);

                // set angle of the man at that position
                //self.rotation.y = angle;
                if (_.isArray(self.character.meshes)) {
                    self.character.meshes.forEach(function(m){
                        m.rotation.y = angle;
                    });
                }
            }            
        }, options);

        // stop current move
        if (!options.append) {
            if (self.currentTween && self.currentTween.stop) {
                self.currentTween.stop();
                delete self.currentTween;
            }
            this.currentTween = Utils.moveAlong(self, linepoints, options);
            return this.currentTween;

        } else {

            this.currentTween.chain(Utils.moveAlong(self, linepoints, options));
            return this.currentTween;            
        }

    };

    ////////////////

    Character.prototype.constructor = Character;

    return Character;
});
