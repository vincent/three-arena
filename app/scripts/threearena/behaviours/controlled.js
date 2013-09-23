define('threearena/behaviours/controlled',

    ['lodash', 'threejs', 'threearena/log', 'threearena/utils', 'threearena/entity'],

    function(_, THREE, log, Utils, Entity) {

        return {
            identifier: "idle", strategy: "prioritised",
            children: [
                { identifier: "moveAttackToObjective" },
                { identifier: "plotCourseToObjective" },
            ]
        };
});
