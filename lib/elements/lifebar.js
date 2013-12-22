'use strict';

var _ = require('lodash');
var inherits = require('inherits');

module.exports = LifeBar;

/**
 * @exports threearena/elements/lifebar
 */
function LifeBar (options) {

  options = _.merge({

  }, options);

  THREE.Object3D.apply(this);

  var texture = THREE.ImageUtils.loadTexture('/gamedata/textures/lifebar.png');

  // life bar
  this.lifebarMaterial = new THREE.MeshBasicMaterial({ color:'#18ee13', map:texture, side:THREE.DoubleSide });
  this.lifebar = new THREE.Mesh(new THREE.PlaneGeometry(10, 1, 50, 1), this.lifebarMaterial);
  this.lifebar.position.setY(16);

  // mana bar
  this.manabarMaterial = new THREE.MeshBasicMaterial({ color:'#12dae6', map:texture, side:THREE.DoubleSide });
  this.manabar = new THREE.Mesh(new THREE.PlaneGeometry(10, 1, 50, 1), this.manabarMaterial);
  this.manabar.position.setY(14.8);

  this.add(this.lifebar);
  this.add(this.manabar);

  this.position.set(1, 0, 5);
}

inherits(LifeBar, THREE.Object3D);

LifeBar.prototype.set = function(data) {
  if (data.life !== false) { this.setLife(data.life); }
  if (data.mana !== false) { this.setMana(data.mana); }
};

LifeBar.prototype.setLife = function(life) {
  if (life === false) {
    this.remove(this.lifebar);

  } else if (life > 0) {
    this.lifebar.scale.setX(life);

  } else {
    this.lifebar.visible = false;
  }
};

LifeBar.prototype.setMana = function(mana) {
  if (mana === false) {
    this.remove(this.manabar);

  } else if (mana > 0) {
    this.manabar.visible = true;
    this.manabar.scale.setX(mana);

  } else {
    this.manabar.visible = false;
  }
};

LifeBar.prototype.update = function(delta) {
};

