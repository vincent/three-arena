
define('threearena/elements/lifebar',
    ['lodash', 'threejs'], function(_, THREE) {

    var LifeBar = function(options) {

        THREE.Object3D.apply(this);

        var texture = THREE.ImageUtils.loadTexture("/gamedata/textures/lifebar.png");

        // life bar
        this.lifebarMaterial = new THREE.MeshBasicMaterial({ color:'#18ee13', map:texture })
        this.lifebar = new THREE.Mesh(new THREE.PlaneGeometry(10, 1, 50, 1), this.lifebarMaterial)
        this.lifebar.position.setY(16);

        // mana bar
        this.manabarMaterial = new THREE.MeshBasicMaterial({ color:'#12dae6', map:texture })
        this.manabar = new THREE.Mesh(new THREE.PlaneGeometry(10, 1, 50, 1), this.manabarMaterial)
        this.manabar.position.setY(14.8);

        this.add(this.lifebar);
        this.add(this.manabar);

        this.position.set(1, 0, 5);
    };
    LifeBar.prototype = new THREE.Object3D();

    LifeBar.prototype.set = function(data) {
        data.life && this.setLife(data.life);
        data.mana && this.setMana(data.mana);
    };

    LifeBar.prototype.setLife = function(life) {
        if (life === false) {
            this.remove(this.lifebar);

        } else if (life > 0) {
            this.lifebar.scale.setX(life);

        } else {
            this.lifebar.visible = false;
        }
    };

    LifeBar.prototype.setMana = function(mana) {
        if (mana === false) {
            this.remove(this.manabar);

        } else if (mana > 0) {
            this.manabar.visible = true;
            this.manabar.scale.setX(mana);
        } else {
            this.manabar.visible = false;
        }
    };

    LifeBar.prototype.constructor = THREE.LifeBar;

    return LifeBar;
});
