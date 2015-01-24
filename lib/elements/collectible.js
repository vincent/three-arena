'use strict';

var _ = require('lodash');
var inherits = require('inherits');

module.exports = Collectible;

/**
 * @exports threearena/elements/collectible
 */
function Collectible (options) {

  THREE.Object3D.apply(this);

  options = options || {};

  this.collectible = _.merge({

    kind: 'dummy',

    amount: 1000,

    workers: {},
    workersCount: 0,

  }, options);

  if (options.onLoad) { options.onLoad(); }
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

Collectible.prototype.addWorker = function (entity) {
  if (! this.collectible.workers[entity.uuid]) {
    this.collectible.workers[entity.uuid] = entity;
    this.collectible.workersCount++;
  }
};

Collectible.prototype.removeWorker = function (entity) {
  if (this.collectible.workers[entity.uuid]) {
    this.collectible.workers[entity.uuid] = null;
    this.collectible.workersCount--;
  }
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

      this.collectible.amount -= eventData.amount;

      if (this.collectible.amount <= 0) {
        this.parent.remove(this);
      }

      // play sound

      entity.state.inventory.push(eventData);

      return callback(null, eventData);
    }
  }

  callback(true);
};

