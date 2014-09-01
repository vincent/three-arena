
var inherits = require('inherits');

var Stack = require('../../utils/stack');
var Goal = require('./index');

module.exports = CompositeGoal;

function CompositeGoal (entity) {

    Goal.apply(this, entity);

    this.subgoals = new Stack();
}

inherits(CompositeGoal, Goal);

CompositeGoal.prototype.activate = function() {

    this.status = Goal.ACTIVE;
};

CompositeGoal.prototype.terminate = function() {

    while (! this.subgoals.empty()) {
        var goal = this.subgoals.pop();
        goal.data.terminate();
    }
};

CompositeGoal.prototype.process = function() {

    // first, clean the finished subgoals
    while (! this.subgoals.empty() && this.subgoals.top.data.isComplete() || this.subgoals.top.data.hasFailed()) {
        var goal = this.subgoals.pop().data;
        goal.terminate();
    }

    // then process the next subgoal
    if (! this.subgoals.empty()) {
        var subgoalsStatus = this.subgoals.top.data.process();

        // if we completed the only remaining goal
        if (subgoalsStatus === Goal.COMPLETED && this.subgoals.size === 1) {
            return Goal.ACTIVE;
        }

        return subgoalsStatus;
    }
};

CompositeGoal.prototype.addSubgoal = function(goal) {

    this.subgoals.push(goal);
};

CompositeGoal.prototype.removeAllSubgoals = function() {

    this.terminate();
};
