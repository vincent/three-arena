'use strict';

var _ = require('lodash');
var inherits = require('inherits');

module.exports = Collectible;

/**
 * @exports threearena/elements/collectible
 */
function Collectible (options) {

  var self = this;

  THREE.Object3D.apply(this);

  options = _.merge({
    collectible: [
      { type:'gold', amount:1000 }
    ]
  }, options);

  this.collectible = options.collectible;

  var loader = new THREE.OBJMTLLoader();
  loader.addEventListener( 'load', function ( event ) {

    var object = event.content;

    object.scale = new THREE.Vector3(8, 8, 8);
    self.add( object );

    if (options.onLoad) { options.onLoad(); }
  });

  loader.load('/gamedata/models/chest/chest.obj', '/gamedata/models/chest/chest.mtl');
}

inherits(Collectible, THREE.Object3D);

Collectible.prototype.isNearEnough = function(object) {
  return this.position.distanceTo(object.position) <= 20;
};


