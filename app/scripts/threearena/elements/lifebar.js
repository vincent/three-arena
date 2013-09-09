
define('threearena/elements/lifebar',
    ['lodash', 'threejs'], function(_, THREE) {

    var LifeBar = function( options ) {

        THREE.Object3D.apply( this );

        var texture = THREE.ImageUtils.loadTexture( "/gamedata/textures/lifebar.png" );

        // life bar
        this.lifebarMaterial = new THREE.MeshBasicMaterial({ color:'#18ee13', map:texture })
        this.lifebar = new THREE.Mesh( new THREE.PlaneGeometry(10, 1, 50, 1), this.lifebarMaterial )
        this.lifebar.position.setY(16);

        // mana bar
        this.manabarMaterial = new THREE.MeshBasicMaterial({ color:'#12dae6', map:texture })
        this.manabar = new THREE.Mesh( new THREE.PlaneGeometry(10, 1, 50, 1), this.manabarMaterial )
        this.manabar.position.setY(14.8);

        this.add(this.lifebar);
        this.add(this.manabar);
    };
    LifeBar.prototype = new THREE.Object3D();

    LifeBar.prototype.constructor.setLife = function( life ) {
        this.lifebar.scale.setX( life );
    };

    LifeBar.prototype.constructor.setMana = function( mana ) {
        this.manabar.scale.setX( mana );
    };

    LifeBar.prototype.constructor = THREE.LifeBar;

    return LifeBar;
});
