'use strict';

module.exports = Inventory;

/**
 * Represents a character's inventory
 *
 * @exports Inventory

 * @constructor

 * @param {Entity} entity Entity who owns this inventory
 */
function Inventory (entity) {

  this.entity = entity;

  this.contents = [];
}

/**
 * Add something in the inventory
 *
 * @param  {Object} data The object data { kind: "Stuff", amount: "123" }
 *
 * @triggers 'entity:collect'
 */
Inventory.prototype.push = function(data) {

  this.contents.push(data);

  this.entity.emit('collect', data);
};


/**
 * Get amount of a given kind
 *
 * @param  {String} kind
 */
Inventory.prototype.has = function(kind) {

  var amount = 0;

  for (var i = 0; i < this.contents.length; i++) {
    if (this.contents[i].kind === kind) {
      amount += this.contents[i].amount;
    }
  }

  return amount;
};