var health   = require('../features/health');

module.exports = AttackEvaluator;

function AttackEvaluator () {
}

AttackEvaluator.compute = function (arena, entity) {
    var tweaker = 1;
    return tweaker * health.compute(arena, entity);
}