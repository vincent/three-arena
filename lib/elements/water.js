'use strict';

var _ = require('lodash');
var inherits = require('inherits');

module.exports = Water;

/**
 * @exports threearena/elements/water
 */
function Water (width, height) {

  THREE.Object3D.apply(this);

  var noiseTexture = new THREE.ImageUtils.loadTexture( '/gamedata/textures/cloud.png' );
  noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping;

  var waterTexture = new THREE.ImageUtils.loadTexture( '/gamedata/textures/water.jpg' );
  waterTexture.wrapS = waterTexture.wrapT = THREE.RepeatWrapping;

  // use "this." to create global object
  this.customUniforms2 = {
    baseTexture:    { type: 't', value: waterTexture },
    baseSpeed:      { type: 'f', value: 1.15 },
    noiseTexture:   { type: 't', value: noiseTexture },
    noiseScale:     { type: 'f', value: 0.2 },
    alpha:          { type: 'f', value: 0.8 },
    time:           { type: 'f', value: 1.0 }
  };

  // create custom material from the shader code above
  //   that is within specially labeled script tags
  var customMaterial2 = new THREE.ShaderMaterial({
    uniforms: this.customUniforms2,
    vertexShader:   document.getElementById( 'waterVertexShader'   ).textContent,
    fragmentShader: document.getElementById( 'waterFragmentShader' ).textContent
  });

  // other material properties
  customMaterial2.side = THREE.DoubleSide;
  customMaterial2.transparent = true;

  // apply the material to a surface
  var flatGeometry = new THREE.PlaneGeometry( width, height );
  var surface = new THREE.Mesh( flatGeometry, customMaterial2 );
  surface.rotation.x = - 90 * Math.PI / 180;
  this.add( surface );

  window._ta_events.on('update', _.bind( this.update, this ));
}

inherits(Water, THREE.Object3D);

Water.prototype.update = function(game) {
  this.customUniforms2.time.value += game.delta;
};

