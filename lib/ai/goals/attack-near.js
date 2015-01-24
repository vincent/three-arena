
var inherits = require('inherits');
var CompositeGoal = require('./composite');
var SeekGoal = require('./seek');

module.exports = AttackNearGoal;

function AttackNearGoal (entity) {
    CompositeGoal.apply(this, entity);
}

inherits(AttackNearGoal, CompositeGoal);

AttackNearGoal.prototype.activate = function() {
    this.status = Goal.ACTIVE;
    this.removeAllSubgoals();

    if (! this.entity.targetSystem.isTargetStillPresent()) {

        this.status = Goal.COMPLETED;
        return;

    } else if (this.entity.targetSystem.isTargetInSight()) {

        self.cast(self.state.spells[0], self._nearestEnnemy);

    } else {

        this.addSubGoal(new SeekGoal(this.game, this.entity, this.entity.targetSystem.current()));

    }
};

AttackNearGoal.prototype.process = function() {
    this.activate();

    this.status = this.processSubGoals();

    if (this.status === Goal.FAILED) {
        this.activate();
    }

    return this.status;
};

