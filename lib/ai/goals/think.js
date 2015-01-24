
var inherits = require('inherits');
var Goal = require('./index');

module.exports = ThinkGoal;

function ThinkGoal (entity) {
    Goal.apply(this, entity);
}

inherits(ThinkGoal, Goal);

ThinkGoal.prototype.activate = function() {
    this.status = Goal.ACTIVE;
};

ThinkGoal.prototype.terminate = function() {
};

ThinkGoal.prototype.process = function() {
    return this.status;
};

ThinkGoal.prototype.addEvaluator = function(evaluator) {
    this.evaluators.push(evaluator);
};

ThinkGoal.prototype.arbitrate = function() {
    var best, mostDesirable;

    for (var i = 0; i < this.evaluators.length; i++) {
        var desirability = this.evaluators[i].desirability(this.entity, this.entity.game);
        if (desirability >= best) {
            best = desirability;
            mostDesirable = this.evaluators[i];
        }
    }

    if (mostDesirable) {
        mostDesirable.setGoal(entity);
    }
};