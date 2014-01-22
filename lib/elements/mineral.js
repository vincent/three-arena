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

  Collectible.apply(this);

  this.collectible = _.merge({

    kind: 'mineral',

    amount: 1000

  }, options);

  var loader = new THREE.OBJMTLLoader();
  loader.addEventListener( 'load', function ( event ) {

    var object = event.content;

    object.scale.set(8, 8, 8);

    self.add(object);

    if (options.onLoad) { options.onLoad(); }
  });

  loader.load('/gamedata/models/mineral/mineral.obj', '/gamedata/models/mineral/mineral.mtl');
}

inherits(Mineral, Collectible);
