'use strict';

var inherits = require('inherits');

/**
 * @exports threearena/particles/snow
 */
function Snow (count, tex) {

  THREE.Object3D.apply(this);

  function rand(v) {
    return (v * (Math.random() - 0.5));
  }

  var numParticles = 10000,
    particleSystemHeight = 100.0,
    width = 100,
    height = particleSystemHeight,
    depth = 100,
    texture = THREE.ImageUtils.loadTexture( '/gamedata/textures/lensflare1_alpha.png' ),
    parameters = {
      color: 0xFFFFFF,
      height: particleSystemHeight,
      radiusX: 2.5,
      radiusZ: 2.5,
      size: 100,
      scale: 4.0,
      opacity: 0.4,
      speedH: 1.0,
      speedV: 1.0
    },
    systemGeometry = new THREE.Geometry(),
    systemMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color:  { type: 'c', value: new THREE.Color( parameters.color ) },
        height: { type: 'f', value: parameters.height },
        elapsedTime: { type: 'f', value: 0 },
        radiusX: { type: 'f', value: parameters.radiusX },
        radiusZ: { type: 'f', value: parameters.radiusZ },
        size: { type: 'f', value: parameters.size },
        scale: { type: 'f', value: parameters.scale },
        opacity: { type: 'f', value: parameters.opacity },
        texture: { type: 't', value: texture },
        speedH: { type: 'f', value: parameters.speedH },
        speedV: { type: 'f', value: parameters.speedV }
      },
      vertexShader: document.getElementById( 'step07_vs' ).textContent,
      fragmentShader: document.getElementById( 'step09_fs' ).textContent,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthTest: false
    });
 
  for (var i = 0; i < numParticles; i++) {
    var vertex = new THREE.Vector3(
      rand( width ),
      Math.random() * height,
      rand( depth )
    );
    systemGeometry.vertices.push( vertex );
  }

  this.particleSystem = new THREE.ParticleSystem( systemGeometry, systemMaterial );
  this.particleSystem.position.y = -height / 2;

  this.add(this.particleSystem);
}

inherits(Snow, THREE.Object3D);


Snow.prototype.update = function(game) {
  this.particleSystem.material.uniforms.elapsedTime.value = game.delta * 10;
};
