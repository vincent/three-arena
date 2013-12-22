'use strict';

module.exports = ParticleCloud;

/**
 * @exports threearena/particles/shadercloud
 */
function ParticleCloud ( size, texture, light, options ) {

  // Create a particle group to add the emitter to.
  var particleGroup = new ShaderParticleGroup({
    // Give the particles in this group a texture
    texture: texture,

    // How long should the particles live for? Measured in seconds.
    maxAge: 3
  });

  // Create a single emitter
  var particleEmitter = new ShaderParticleEmitter({
    type: 'cube',
    position: new THREE.Vector3(0, 0, 0),
    acceleration: new THREE.Vector3(0, 2, 0),
    velocity: new THREE.Vector3(0, 1, 0),
    particlesPerSecond: 100,
    size: 10,
    sizeEnd: 0,
    opacityStart: 1,
    opacityEnd: 0,
    colorStart: new THREE.Color('red'),
    colorEnd: new THREE.Color('yellow')
  });

  // Add the emitter to the group.
  particleGroup.addEmitter( particleEmitter );

  // Add the particle group to the scene so it can be drawn.
  this.particleCloud = particleGroup.mesh; // Where `scene` is an instance of `THREE.Scene`.
}
