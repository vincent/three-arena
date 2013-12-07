define('threearena/behaviours/minion',

    ['lodash', 'threejs', 'threearena/log', 'threearena/utils', 'threearena/entity'],

    function(_, THREE, log, Utils, Entity) {

        return {
            identifier: "nothing", strategy: "prioritised",
            children: [
                { identifier: "beDead" },
                { identifier: "fightObjective" },
                { identifier: "fightNearbyEnnemy" },
                { identifier: "followCourseToObjective" },
                { identifier: "plotCourseToObjective" },
            ]
        };
});
