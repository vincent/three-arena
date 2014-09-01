
var inherits = require('inherits');
var Goal = require('./index');

module.exports = FindHealthGoal;

function FindHealthGoal (entity) {
    Goal.apply(this, entity);
}

inherits(FindHealthGoal, Goal);

FindHealthGoal.prototype.activate = function() {
    this.status = Goal.ACTIVE;
};

FindHealthGoal.prototype.terminate = function() {
};

FindHealthGoal.prototype.process = function() {
    this.activate();
    // move to nearest health item
};
