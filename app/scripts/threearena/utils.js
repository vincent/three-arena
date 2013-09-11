define('threearena/utils',
    ['lodash', 'threejs'], function(_, THREE) {

    return {

        gcb: function( wrappedFunction ) {

            var now = new Date(),
                tmpname = '__tmp_' + parseInt(Math.random() + now.getTime()) + '__';

            var done = function(){
                delete window[tmpname];
            };
            window[tmpname] = wrappedFunction;

            return tmpname;
        },

        moveAlong: function( object, shape, options ) {
            var options = _.merge({

                from: 0,
                to: 1,

                smoothness: 100,
                easing: TWEEN.Easing.Linear.None,

            }, options);

            // array of vectors to determine shape
            var shape = ( shape instanceof THREE.Shape ? shape : new THREE.SplineCurve3( shape ) );

            options.duration = options.duration || shape.getLength() * 70;

            return new TWEEN.Tween({ distance: options.from })
                .to({ distance: options.to }, options.duration) // use 
                .easing( options.easing )
                .onStart(function(){
                    options.onStart();
                })
                .onComplete(function(){
                    options.onComplete();
                })
                .onUpdate(function(){
                    // get the position data half way along the path
                    var pathPosition = shape.getPoint(this.distance);

                    // move the man to that position
                    object.position.set(pathPosition.x, pathPosition.y, pathPosition.z);

                    object.updateMatrix();

                    options.onUpdate(this, shape);
                })
                .start();
        }
    };
});