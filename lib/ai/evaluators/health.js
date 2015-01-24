var health   = require('../features/health');
var nearest = require('../features/nearest');

module.exports = GetHealthEvaluator;

function GetHealthEvaluator () {
}

GetHealthEvaluator.compute = function (arena, entity) {
        var tweaker = 1;
        return (1 - health.compute(arena, entity)) / nearest(arena, entity, 'HealthUpgrade');
    }
}