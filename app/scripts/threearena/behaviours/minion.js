define('threearena/behaviours/minion',

    ['lodash', 'threejs', 'threearena/log', 'threearena/utils', 'threearena/entity'],

    function(_, THREE, log, Utils, Entity) {

        return {
            identifier: "idle", strategy: "prioritised",
            children: [
                { identifier: "fightObjective" },
                { identifier: "fightNearbyEnnemy" },
                { identifier: "followCourseToObjective" },
                { identifier: "plotCourseToObjective" },
            ]
        };
});
