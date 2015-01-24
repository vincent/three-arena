'use strict';

var _ = require('lodash');
var inherits = require('inherits');

var Collectible = require('./collectible');

module.exports = Mineral;

/**
 * @exports threearena/elements/mineral
 */
function Mineral (options) {

  var self = this;

  options = _.merge({

    kind: 'mineral',

    amount: 1000

  }, options);

  Collectible.apply(this, options);

  var loader = new THREE.OBJMTLLoader();

  loader.load('/gamedata/models/mineral/mineral.obj', '/gamedata/models/mineral/mineral.mtl', function ( object ) {

    object.scale.set(8, 8, 8);

    self.add(object);

    if (options.onLoad) { options.onLoad(); }
  });
}

inherits(Mineral, Collectible);
