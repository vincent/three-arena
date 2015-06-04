'use strict';

var _ = require('lodash');
var inherits = require('inherits');

var GameObject = require('../gameobject');
var waterMaterial = require('../materials/water');

module.exports = Water;

/**
 * @exports threearena/elements/water
 */
function Water (options) {

  GameObject.apply(this);

  var waterNormals = new THREE.ImageUtils.loadTexture('/gamedata/textures/waternormals.jpg');
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

  this.material = waterMaterial;

  this.water = new THREE.Water(options.renderer, options.camera, options.scene, {
    textureWidth: 256,
    textureHeight: 256,
    waterNormals: waterNormals,
    alpha:  1.0,
    sunDirection: options.directionalLight.position.normalize(),
    sunColor: 0xffffff,
    waterColor: 0x00000f,
    betaVersion: 1
  });

  // apply the material to a surface
  var flatGeometry = new THREE.PlaneBufferGeometry( 256, 256 );
  var surface = new THREE.Mesh(flatGeometry, this.water.material);
  surface.rotation.x = - 90 * Math.PI / 180;
  surface.add(this.water);

  this.add(surface);

  window._ta_events.on('update', this.update.bind(this));
}

inherits(Water, GameObject);

Water.prototype.update = function(game) {
  this.water.material.uniforms.time.value += game.delta;
};

