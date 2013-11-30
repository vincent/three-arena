/**
 * @module Utils
 */
define('threearena/utils',
    ['lodash', 'threejs'], function(_, THREE) {

    return {

        /**
         * A basic glowing material, to be used on active objects
         * @type {Object}
         */
        glowmaterial: {
            ambient: new THREE.Color(1, 1, 1),
            vertexShader:   document.getElementById( 'glow_vertexshader'   ).textContent,
            fragmentShader: document.getElementById( 'glow_fragmentshader' ).textContent,
            //side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        },

        /**
         * get a globaly defined callback
         * @param  {Function} wrappedFunction
         * @return {String} the wrapping function name, defined in the global scope
         */
        gcb: function( wrappedFunction ) {

            var now = new Date(),
                tmpname = '__tmp_' + parseInt(Math.random() + now.getTime()) + '__';

            var done = function(){
                delete window[tmpname];
            };
            window[tmpname] = wrappedFunction;

            return tmpname;
        },

        /**
         * Apply a glowing effect on an object
         * @param  {THREE.Mesh} object
         */
        glow: function (object) {
            _.each(this.glowmaterial, function(v, k){
                object.material[ '_' + k] = object.material[k];
                object.material[k] = v;
            });
        },

        /**
         * Remove the glowing effect from an object
         * @param  {THREE.Mesh} object
         */
        unglow: function (object) {
            _.each(this.glowmaterial, function(v, k){
                object.material[k] = object.material[ '_' + k];
            });
        },


        // selectOrAbort: function (funcValidate, funcSelect) {
        //     document.addEventListener('click', function(event){

        //     });
        // }

        /**
         * Move an object along a path.
         *  to move entities or characters, use their own moveAlong method
         * @param  {Array|THREE.Shape} the shape, or the points the character will walk along
         * @param  {Object} options, such as
         *              start
         *              onStart
         *              onComplete
         *              onUpdate
         * @return {Tween} the Tween.js object
         */
        moveAlong: function( object, shape, options ) {
            var options = _.merge({

                from: 0,
                to: 1,

                duration: null,
                speed: 50,

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

            options.duration = options.duration || shape.getLength()
            options.length = options.duration * options.speed;

            var tween = new TWEEN.Tween({ distance: options.from })
                .to({ distance: options.to }, options.length) // use 
                .easing( options.easing )
                .onStart(function(){
                    options.onStart && options.onStart(this);
                })
                .onComplete(function(){
                    options.onComplete && options.onComplete(this);
                })
                .onUpdate(function(){
                    // get the position data half way along the path
                    var pathPosition = shape.getPointAt(this.distance);

                    // move the man to that position
                    object.position.set(pathPosition.x, pathPosition.y, pathPosition.z);

                    object.updateMatrix();

                    options.onUpdate && options.onUpdate(this, shape);
                });

            options.start && tween.start();
            return tween;
        },

        childOf: function ( object, classname ) {

            var Class = require(classname);

            while (object.parent && ! (object instanceof Class)) {
                object = object.parent;
            }

            return object instanceof Class ? object : null;
        }

    };
});