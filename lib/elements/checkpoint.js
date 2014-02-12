'use strict';

var _ = require('lodash');
var inherits = require('inherits');

var Material = require('../shaders/lightbolt');

module.exports = Checkpoint;

/**
 * @exports threearena/elements/checkpoint
 */
function Checkpoint (options) {

  var self = this;

  THREE.Object3D.apply(this);

  this.options = _.merge({

    height: 200,
    radius: 4,

    triggerRange: 5,

    trigger: function(entity) {
      console.log('%o triggers checkpoint !', entity);
    }

  }, options);

  this.material = new Material();

  this.geom = new THREE.CylinderGeometry(this.options.radius, this.options.radius, this.options.height, 16, 2 * this.options.height, true);

  this.mesh = new THREE.Mesh(this.geom, this.material);

  self.add(this.mesh);

  window._ta_events.on('update', this.update.bind(this));

  if (options.onLoad) { options.onLoad(self); }
}

inherits(Checkpoint, THREE.Object3D);

Checkpoint.prototype.update = function(arena) {

  var self = this;

  self.material.uniforms.time.value += arena.delta * 0.5;

  for (var i = 0; i < arena.entities.length; i++) {
    if (arena.entities[i].isDead()) { continue; }

    if (arena.entities[i].position.distanceTo(self.position) < self.options.triggerRange) {
      self.options.trigger(arena.entities[i]);
    }
  }
};