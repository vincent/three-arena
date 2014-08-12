'use strict';

var _ = require('lodash');
var TWEEN = require('tween');

module.exports = {

  /**
   * A basic glowing material, to be used on active objects
   * @type {Object}
   * /
  glowmaterial: {
    ambient: new THREE.Color(1, 1, 1),
    vertexShader:   document.getElementById( 'glow_vertexshader'   ).textContent,
    fragmentShader: document.getElementById( 'glow_fragmentshader' ).textContent,
    //side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true
  },
  */

  /**
   * get a globaly defined callback
   * @param  {Function} wrappedFunction
   * @return {String} the wrapping function name, defined in the global scope
   */
  gcb: function( wrappedFunction ) {

    var now = new Date(),
        tmpname = '__tmp_' + parseInt(Math.random() + now.getTime()) + '__';

    // TODO: remove tmp function when it's done
    // var done = function(){
    //   delete window[tmpname];
    // };

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

  meshFromVertices: function (vertices, mat_options) {
      
    var object = new THREE.Object3D();
    var materials = [ new THREE.MeshBasicMaterial(mat_options) ];

    for (var i = 0; i < vertices.length; i++) {
      if (!vertices[i+2]) { break; }

      var child = THREE.SceneUtils.createMultiMaterialObject(
        new THREE.ConvexGeometry([ vertices[i], vertices[i+1], vertices[i+2] ]),
        materials);
      object.add(child);
    }
    return object;
  },

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

    options = _.merge({

      game: null,

      from: 0,
      to: 1,

      duration: null,
      speed: 50,

      start: true,
      yoyo: false,

      onStart: null,
      onComplete: null,
      onUpdate: null,

      smoothness: 100,
      easing: TWEEN.Easing.Linear.None,

    }, options);

    // array of vectors to determine shape
    if (shape instanceof THREE.Shape) {

    } else if (_.isArray(shape)) {
      shape = new THREE.SplineCurve3(shape);

    } else {
      throw '2nd argument is not a Shape, nor an array of vertices';
    }

    var routeMesh;
    if (options.game && options.game.settings.showRoutes) {
      var routeGeometry = new THREE.TubeGeometry(shape, shape.points.length, 1, 1);
      var routeMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        opacity: 0.5,
        wireframe: true,
        transparent: true
      });
      routeMesh = new THREE.Mesh(routeGeometry, routeMaterial);
      options.game.scene.add(routeMesh);
    }

    options.duration = options.duration || shape.getLength();
    options.length = options.duration * options.speed;

    var tween = new TWEEN.Tween({ distance: options.from })
      .to({ distance: options.to }, options.length)
      .easing( options.easing )
      .onStart(function(){
        if (options.onStart) { options.onStart(this); }
      })
      .onComplete(function(){
        if (routeMesh && routeMesh.parent) { routeMesh.parent.remove(routeMesh); }
        if (options.onComplete) { options.onComplete(this); }
      })
      .onUpdate(function(){
        // get the position data half way along the path
        var pathPosition = shape.getPointAt(this.distance);

        // move to that position
        object.position.set(pathPosition.x, pathPosition.y, pathPosition.z);

        object.updateMatrix();

        if (options.onUpdate) { options.onUpdate(this, shape); }
      })
      .yoyo(options.yoyo);

    if (options.yoyo) {
      tween.repeat(Infinity);
    }

    if (options.start) { tween.start(); }

    return tween;
  },

  childOf: function ( object, Class ) {

    while (object.parent && ! (object instanceof Class)) {
      object = object.parent;
    }

    return object instanceof Class ? object : null;
  }

};
