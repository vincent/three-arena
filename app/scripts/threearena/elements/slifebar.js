define('threearena/elements/slifebar',
    ['lodash', 'threejs', 'threearena/shaders/lifebar'], function(_, THREE, LifeBarShader) {

    /**
     * @exports threearena/elements/lifebar
     */
    var LifeBar = function(options) {

        var self = this;

        options = _.merge({

        }, options);

        THREE.Object3D.apply(this);

        // life bar
        this.lifebarMaterial = new LifeBarShader();

        this.lifebar = new THREE.Mesh(new THREE.PlaneGeometry(10, 1, 50, 1), this.lifebarMaterial)
        this.lifebar.position.setY(10);
        this.lifebar.scale.set(1, 5, 1);

        this.add(this.lifebar);

        this.position.set(1, 0, 5);
    };
    LifeBar.prototype = new THREE.Object3D();

    LifeBar.prototype.set = function(data) {
        this.setLife(data.life);
        this.setMana(data.mana);
    };

    LifeBar.prototype.setLife = function(life) {
        this.lifebarMaterial.setLife(life);
    };

    LifeBar.prototype.setMana = function(mana) {
        this.lifebarMaterial.setMana(mana);
    };

    LifeBar.prototype.update = function(delta) {
        this.lifebarMaterial.update(delta);
    };

    LifeBar.prototype.constructor = LifeBar;

    return LifeBar;
});
