define('threearena/character',
    ['lodash', 'threejs', 'threearena/log', 'threearena/utils', 'threearena/entity'], function(_, THREE, log, Utils, Entity) {

    var Character = function( options ) {

        Entity.apply( this );
    };

    Character.prototype = new Entity();

    ////////////////

    Character.prototype.update = function( delta ) {

        this.character.update( delta )
    };

    Character.prototype.moveAlong = function( linepoints ) {

        var self = this;
        
        // stop current move
        if (self.currentTween) {
            self.currentTween.stop();
            delete self.currentTween;
        }

        this.currentTween = Utils.moveAlong( self, linepoints, {
            onStart: function(){
                self.character.controls.moveForward = true;
            },
            onComplete: function(){
                self.character.controls.moveForward = false;
            },
            onUpdate: function(tween, shape) {
                // get the orientation angle quarter way along the path
                var tangent = shape.getTangent(tween.distance);
                var angle = Math.atan2(-tangent.z, tangent.x);

                // set angle of the man at that position
                // object.rotation.y = angle;
                self.character.meshes.forEach(function(m){
                    m.rotation.y = angle;
                });
            }
        });
        return this.currentTween;
    };

    ////////////////

    Character.prototype.constructor = Character;

    return Character;
});
