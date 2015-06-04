'use strict';

var inherits = require('inherits');

var GameObject = require('../gameobject');

module.exports = Flies;

/**
 * @exports threearena/particles/flies
 */
function Flies (count, tex) {

  GameObject.apply(this);

  this.deltas = new Array(count);
  for (var i = 0; i < count; i++) { this.deltas[i] = Math.random(); }

  this.path = this.computePath(5, 3);

  this.map1 = THREE.ImageUtils.loadTexture('/gamedata/textures/flies/' + (tex || 'butterfly.' + 1 + '.png'));
  this.map1.needsUpdate = true;

  this.map2 = THREE.ImageUtils.loadTexture('/gamedata/textures/flies/' + (tex || 'butterfly.' + 2 + '.png'));
  this.map2.needsUpdate = true;

  this.material = new THREE.ParticleBasicMaterial({
    size: count,
    map: this.map1,
    transparent: true
  });

  this.points = new THREE.Geometry();

  this.points.vertices.push(new THREE.Vector3(0, 0, 0));
  this.points.vertices.push(new THREE.Vector3(0, 0, 0));
  this.points.vertices.push(new THREE.Vector3(0, 0, 0));

  this.flies = new THREE.ParticleSystem(this.points, this.material);
  this.flies.sortParticles = true;

  this.flies.scale.set(1, 1, 1);

  this.add(this.flies);
}

inherits(Flies, GameObject);

Flies.prototype.computePath = function(radius, height) {

  return new THREE.ClosedSplineCurve3([

    new THREE.Vector3(0, 0, radius*2),
    new THREE.Vector3(radius, height, radius),

    new THREE.Vector3(-radius*2, height, -radius*2),
    new THREE.Vector3(0.5, height, radius*2),

    new THREE.Vector3(-radius*3, 0, -radius),
    new THREE.Vector3(0.8, height, -radius*2),

    new THREE.Vector3(radius-1, height, -radius),
    new THREE.Vector3(-radius, height / 2, radius)
  ]);
};

Flies.prototype.update = function(game) {

  this.material.map = Math.random() > 0.7 ? this.map2 : this.map1;

  var point;
  for (var i = 0; i < this.points.vertices.length; i++) {

    this.deltas[i] += game.delta * 0.2;
    if (this.deltas[i] > 1) {
      this.deltas[i] = 1 - this.deltas[i];
    }

    point = this.path.getPoint( (i % 2 ? -1 : 1) * this.deltas[i]);

    this.points.vertices[i].set(point.x, point.y, point.z);
  }
};
