'use strict';

var inherits = require('inherits');

module.exports = BuffIcon;

/**
 * @exports threearena/elements/bufficon
 */
function BuffIcon (options) {

  options = options || {};

  THREE.Object3D.apply(this);

  options.texture = options.texture || THREE.ImageUtils.loadTexture('/gamedata/textures/BuffIcon.png');

  this.bufficonMaterial = new THREE.MeshBasicMaterial({ color: '#18ee13', map: options.texture });

  this.bufficon = new THREE.Mesh(new THREE.PlaneGeometry( 10, 1, 50, 1 ), this.BuffIconMaterial);

  this.bufficon.position.setY(16);

  this.add(this.bufficon);

  this.position.set(1, 0, 5);
}

inherits(BuffIcon, THREE.Object3D);
