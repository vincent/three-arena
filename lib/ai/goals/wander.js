
var inherits = require('inherits');
var Goal = require('./index');

module.exports = WanderGoal;

function WanderGoal (entity) {
    Goal.apply(this, entity);
}

inherits(WanderGoal, Goal);

WanderGoal.prototype.activate = function() {
    this.status = Goal.ACTIVE;
};

WanderGoal.prototype.terminate = function() {
    this.entity.steerings.currently('wander', false);
};

WanderGoal.prototype.process = function() {
    this.activate();
    this.entity.steerings.currently('wander', true);
};
