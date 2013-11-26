define('threearena/elements/interactiveobject',

    ['lodash', 'microevent', 'threejs', 'threearena/utils'], function(_, MicroEvent, THREE, Utils) {

    /**
     * @exports threearena/elements/interactiveobject
     */
    var InteractiveObject = function(options) {

        options = options || {};

        this.menu = options.menu || {};

        THREE.Object3D.apply(this);
    };

    InteractiveObject.prototype = new THREE.Object3D();

    /////////////////////

    InteractiveObject.prototype.select = function() {
        this.trigger('selected');
        this.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                Utils.glow(child);
            }
        });
    };

    InteractiveObject.prototype.deselect = function() {
        this.trigger('deselected');
        this.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                Utils.unglow(child);
            }
        });
    };

    InteractiveObject.prototype.isNearEnough = function(object) {
        return this.position.distanceTo(object.position) <= 20;
    };

    /////////////////////

    InteractiveObject.prototype.constructor = THREE.InteractiveObject;
    MicroEvent.mixin(InteractiveObject);
    return InteractiveObject;
});
