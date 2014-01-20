'use strict';

module.exports = Inventory;

function Inventory (entity) {

  this.entity = entity;

  this.contents = [];
}

Inventory.prototype.push = function(data) {

  this.contents.push(data);

  this.entity.emit('collect', data);
};