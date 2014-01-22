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

  this.collectible = _.merge({

    kind: 'gold',

    amount: 1000

  }, options);

  var loader = new THREE.OBJMTLLoader();
  loader.addEventListener( 'load', function ( event ) {

    var object = event.content;

    object.scale.set(8, 8, 8);

    self.add(object);

    if (options.onLoad) { options.onLoad(); }
  });

  loader.load('/gamedata/models/chest/chest.obj', '/gamedata/models/chest/chest.mtl');
}

inherits(Collectible, THREE.Object3D);

/**
 * Proximity test
 * @param  {object}  object Object to test
 * @return {Boolean}  True is object is near enough to collect
 */
Collectible.prototype.isNearEnough = function(object) {

  return this.position.distanceTo(object.position) <= 20;
};

/**
 * Collect function
 * @param  {Entity}   entity   Entity who collect things
 * @param  {Function} callback Callback, called with two arguments : error, and eventData 
 */
Collectible.prototype.collectedBy = function(entity, callback) {

  if (entity) {
    var eventData = { kind: this.collectible.kind, amount: 0 };

    if (this.collectible.amount > 0) {

      eventData.amount = Math.min(this.collectible.amount, 10);

      // play sound

      entity.state.inventory.push(eventData);

      return callback(null, eventData);
    }
  }

  callback(true);
};

