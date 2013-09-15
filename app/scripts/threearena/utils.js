define('threearena/utils',
    ['lodash', 'threejs'], function(_, THREE) {

    return {

        glowmaterial: {
            ambient: new THREE.Color(1, 1, 1),
            vertexShader:   document.getElementById( 'glow_vertexshader'   ).textContent,
            fragmentShader: document.getElementById( 'glow_fragmentshader' ).textContent,
            //side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        },

        gcb: function( wrappedFunction ) {

            var now = new Date(),
                tmpname = '__tmp_' + parseInt(Math.random() + now.getTime()) + '__';

            var done = function(){
                delete window[tmpname];
            };
            window[tmpname] = wrappedFunction;

            return tmpname;
        },

        glow: function (object) {
            _.each(this.glowmaterial, function(v, k){
                object.material[ '_' + k] = object.material[k];
                object.material[k] = v;
            });
        },
        unglow: function (object) {
            _.each(this.glowmaterial, function(v, k){
                object.material[k] = object.material[ '_' + k];
            });
        },

        moveAlong: function( object, shape, options ) {
            var options = _.merge({

                from: 0,
                to: 1,

                start: true,

                onStart: null,
                onComplete: null,
                onUpdate: null,

                smoothness: 100,
                easing: TWEEN.Easing.Linear.None,

            }, options);

            // array of vectors to determine shape
            var shape;
            if (shape instanceof THREE.Shape) {

            } else if (_.isArray(shape)) {
                shape = new THREE.SplineCurve3(shape);
            } else {
                throw '2nd argument is not a Shape, nor an array of vertices';
            }

            options.duration = options.duration || shape.getLength() * 70;

            var tween = new TWEEN.Tween({ distance: options.from })
                .to({ distance: options.to }, options.duration) // use 
                .easing( options.easing )
                .onStart(function(){
                    options.onStart && options.onStart();
                })
                .onComplete(function(){
                    options.onComplete && options.onComplete();
                })
                .onUpdate(function(){
                    // get the position data half way along the path
                    var pathPosition = shape.getPoint(this.distance);

                    // move the man to that position
                    object.position.set(pathPosition.x, pathPosition.y, pathPosition.z);

                    object.updateMatrix();

                    options.onUpdate && options.onUpdate(this, shape);
                });

            options.start && tween.start();
            return tween;
        }
    };
});