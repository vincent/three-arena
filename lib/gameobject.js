'use strict';

var inherits = require('inherits');

module.exports = GameObject;

/**
 * Game object root class
 *
 * @constructor
 */
function GameObject () {

  THREE.Object3D.apply(this);

  this.components = {};

  // this.emit('new-object', this);
}

inherits(GameObject, THREE.Object3D);

/**
 * Determine object component
 *
 * @param  {String} aComponent
 */
GameObject.prototype.its = function(aComponent) {

  return this.components[aComponent];
};
