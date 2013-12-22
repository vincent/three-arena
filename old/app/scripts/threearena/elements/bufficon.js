define('threearena/elements/bufficon',
    ['lodash', 'threejs'], function(_, THREE) {

    /**
     * @exports threearena/elements/bufficon
     */
    var BuffIcon = function(options) {

    	options = options || {};

        THREE.Object3D.apply(this);

        options.texture = options.texture || THREE.ImageUtils.loadTexture("/gamedata/textures/BuffIcon.png");

        // life bar
        this.BuffIconMaterial = new THREE.MeshBasicMaterial({ color:'#18ee13', map:texture })
        this.BuffIcon = new THREE.Mesh(new THREE.PlaneGeometry(10, 1, 50, 1), this.BuffIconMaterial)
        this.BuffIcon.position.setY(16);

        // mana bar
        this.manabarMaterial = new THREE.MeshBasicMaterial({ color:'#12dae6', map:texture })
        this.manabar = new THREE.Mesh(new THREE.PlaneGeometry(10, 1, 50, 1), this.manabarMaterial)
        this.manabar.position.setY(14.8);

        this.add(this.BuffIcon);
        this.add(this.manabar);

        this.position.set(1, 0, 5);
    };
    BuffIcon.prototype = new THREE.Object3D();

    BuffIcon.prototype.set = function(data) {
        data.life && this.setLife(data.life);
        data.mana && this.setMana(data.mana);
    };

    BuffIcon.prototype.setLife = function(life) {
        if (life === false) {
            this.remove(this.BuffIcon);

        } else if (life > 0) {
            this.BuffIcon.scale.setX(life);

        } else {
            this.BuffIcon.visible = false;
        }
    };

    BuffIcon.prototype.setMana = function(mana) {
        if (mana === false) {
            this.remove(this.manabar);

        } else if (mana > 0) {
            this.manabar.visible = true;
            this.manabar.scale.setX(mana);
        } else {
            this.manabar.visible = false;
        }
    };

    BuffIcon.prototype.constructor = THREE.BuffIcon;

    return BuffIcon;
});
