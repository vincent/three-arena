/**
 * @module Elements/AutoSpawn
 */
define('threearena/elements/autospawn',
    ['lodash', 'microevent', 'threejs', 'threearena/utils', 'threearena/pathfinding/recast.emcc.dota.mountains'],

function(_, MicroEvent, THREE, Utils, PathFinding) {
    PathFinding = Module;

    var AutoSpawn = function(options) {

        this.options = _.merge({

            entity: null,
            entityOptions: {},

            delay: 1000,

            path: null,
            towards: null,

            tweenOptions: {
                speed: 6
            },

            groupOf: 1,

            eachInterval: 800,
            eachGroupInterval: 30 * 1000,

        }, options);

        THREE.Object3D.apply(this);
    };

    AutoSpawn.prototype = new THREE.Object3D();

    /////////////////////

    AutoSpawn.prototype.setPath = function(path) {
        this.options.path = path;
    };


    AutoSpawn.prototype.start = function() {
        if (! this.parent instanceof THREE.Scene) {
            throw "A pool must be added to a scene before start"
        } else {
            setTimeout(_.bind(function(){
                this.spanwGroup();
            }, this), this.options.delay);
        }
    };

    AutoSpawn.prototype.spanwGroup = function() {

        // // path has not been defined yet
        // if (! this.options.path && this.options.towards) {
        //     PathFinding.findPath(
        //         this.position.x, this.position.y, this.position.z,
        //         this.options.towards.x, this.options.towards.y, this.options.towards.z,
        //         10000,
        //         Utils.gcb( _.bind(function(pathArray){
        //             this.setPath(pathArray);
        //             this.spanwGroup();
        //         }, this) )
        //     );

        // // ok we have a real path to follow
        // } else {

            for (var i = 0; i < this.options.groupOf; i++) {
                setTimeout(_.bind(function(){
                    this.spanwOne();
                }, this), this.options.eachInterval * i);
            }

            // register next group
            setTimeout(_.bind(function(){
                this.spanwGroup();
            }, this), this.options.eachGroupInterval);
        // }
    };

    AutoSpawn.prototype.spanwOne = function() {
        var self = this,
            character = new this.options.entity({
                onLoad: function(){
                    self.trigger('spawnedone', character);
                    // character.moveAlong(self.options.path, self.tweenOptions);                
                }
            });
    };


    /////////////////////

    AutoSpawn.prototype.constructor = THREE.AutoSpawn;
    MicroEvent.mixin(AutoSpawn);
    return AutoSpawn;
});
