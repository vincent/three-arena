'use strict';

var _ = require('lodash');
var inherits = require('inherits');

module.exports = ZoneSelector;

/**
 * @exports threearena/controls/zoneselector
 * 
 * @constructor
 */
function ZoneSelector(arena, options) {

  THREE.Object3D.apply(this);

  this.options = _.merge({

    size: 15,

  }, options);

  this.material = this.options.material || new THREE.MeshBasicMaterial({
    color: 0xdd0202,
    transparent: true,
    opacity: 0.9,
    map: THREE.ImageUtils.loadTexture('/gamedata/textures/summoning_circles/circle4.bold.png'),
    blending: THREE.AdditiveBlending,
  });
  this.material.map.needsUpdate = true;

  this.plane = new THREE.Mesh( new THREE.PlaneGeometry( this.options.size, this.options.size ), this.material );
  this.plane.rotation.x = - 90 * Math.PI / 180;
  // this.plane.position.y = 6;

  this.add(this.plane);
}

inherits(ZoneSelector, THREE.Object3D);


