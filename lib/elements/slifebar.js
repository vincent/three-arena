'use strict';

var _ = require('lodash');
var inherits = require('inherits');

var GameObject = require('../gameobject');
var LifeBarShader = require('../shaders/imglifebar');

module.exports = LifeBar;

/**
 * @exports threearena/elements/lifebar
 */
function LifeBar (options) {

  options = _.merge({

  }, options);

  GameObject.apply(this);

  // life bar
  this.lifebarMaterial = new LifeBarShader();

  this.lifebar = new THREE.Mesh(new THREE.PlaneBufferGeometry(10, 2, 1, 1), this.lifebarMaterial);
  this.lifebar.position.setY(10);
  // this.lifebar.scale.set(1, 5, 1);

  this.add(this.lifebar);

  this.position.set(1, 0, 5);
}

inherits(LifeBar, GameObject);

LifeBar.prototype.set = function(data) {
  this.setLife(data.life);
  this.setMana(data.mana);
};

LifeBar.prototype.setLife = function(life) {
  this.lifebarMaterial.setLife(life);
};

LifeBar.prototype.setMana = function(mana) {
  this.lifebarMaterial.setMana(mana);
};

LifeBar.prototype.update = function(delta) {
  this.lifebarMaterial.update(delta);
};

