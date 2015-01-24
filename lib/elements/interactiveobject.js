'use strict';

var inherits = require('inherits');

var Utils = require('../utils');

module.exports = InteractiveObject;

/**
 * @exports threearena/elements/interactiveobject
 * 
 * @constructor
 */
function InteractiveObject (options) {

  options = options || {};

  this.menu = options.menu || {};

  THREE.Object3D.apply(this);
}

inherits(InteractiveObject, THREE.Object3D);

//////////////////

InteractiveObject.prototype.on = InteractiveObject.prototype.addEventListener;

InteractiveObject.prototype.emit = function (event, data) {
  data = data || {};
  data.type = event;
  this.dispatchEvent(data);
};

//////////////////

InteractiveObject.prototype.select = function() {
  this.emit('selected');
  this.traverse(function (child) {
    if (child instanceof THREE.Mesh) {
      Utils.glow(child);
    }
  });
};

InteractiveObject.prototype.deselect = function() {
  this.emit('deselected');
  this.traverse(function (child) {
    if (child instanceof THREE.Mesh) {
      Utils.unglow(child);
    }
  });
};

InteractiveObject.prototype.isNearEnough = function(object) {
  return this.position.distanceTo(object.position) <= 20;
};
