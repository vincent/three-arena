'use strict';

var now = require('now');
var _ = require('lodash');
var debug = require('debug')('entity');
var inherits = require('inherits');
//var EventEmitter = require('events').EventEmitter;

var log = require('./log');
var settings = require('./settings');
var Stately = require('stately.js');

module.exports = FSM;

function FSM (entity) {

	var states = {};

	Stately.machine.apply(this, states);
}

/* * /
var door = Stately.machine({
    'OPEN': {
        'close':  // => 'CLOSED'
    },
    'CLOSED': {
        'open':   // => 'OPEN',
        'lock':   // => 'LOCKED'
    },
    'LOCKED': {
        'unlock': // => 'CLOSED',
        'break':  // => 'BROKEN'
    },
    'BROKEN': {
        'fix': function () {
            this.fixed = (this.fixed === undefined ? 1 : ++this.fixed);
            return this.fixed < 3 ? this.OPEN : this.BROKEN;
        }
    }
});

/* */
