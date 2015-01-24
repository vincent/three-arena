'use strict';

var _ = require('lodash');
var debug = require('debug')('goal');

var inherits = require('inherits');
var EventEmitter = require('EventEmitter');

module.exports = Goal;

function Goal (entity) {
    this.entity  = entity;
    this.status = Goal.INACTIVE;
}

inherits(Goal, EventEmitter);

/////////////////////////////

Goal.FAILED     = 0;
Goal.ACTIVE     = 1;
Goal.INACTIVE  = 2;
Goal.COMPLETED = 4;

/////////////////////////////

Goal.prototype.handleMessage = function(event) {
    // throw new Error('handleMessage() must be implemented in subclasses');
};

Goal.prototype.activate = function() {
    throw new Error('activate() must be implemented in subclasses');
};

Goal.prototype.process = function() {
    throw new Error('process() must be implemented in subclasses');
};

Goal.prototype.terminate = function() {
    throw new Error('terminate() must be implemented in subclasses');
};

