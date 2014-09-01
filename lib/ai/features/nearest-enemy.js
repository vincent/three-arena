var AttackNearGoal = require('../goals/attack-near');

module.exports = NearestEnemyFeature;

function NearestEnemyFeature () {
}

NearestEnemyFeature.compute = function (arena, entity) {
    return entity.state.life / entity.state._baseLife;
};

NearestEnemyFeature.setGoal = function (entity) {
    entity.addGoal(new AttackNearGoal(entity));
};

