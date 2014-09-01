var FindHealthGoal = require('../goals/find-health');

module.exports = HealthFeature;

function HealthFeature () {
}

HealthFeature.compute = function (arena, entity) {
        return entity.state.life / entity.state._baseLife;
    }
};

HealthFeature.setGoal = function (entity) {
    entity.addGoal(new FindHealthGoal(entity));
};

