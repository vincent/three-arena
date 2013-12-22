define('threearena/elements/toxi',
    ['lodash', 'threejs', 'toxi'], function(){

    /**
     * @exports threearena/elements/toxi
     */
    var ToxiElement = function( m, material, scale, meshResolution ) {

        THREE.Object3D.apply( this );

        var material = material || new THREE.MeshNormalMaterial({color: 0xBAE8E6, opacity: 1.0});
        var toxiToThreeSupport = new toxi.THREE.ToxiclibsSupport( new THREE.Scene() ),
            threeMesh = undefined;

        var sh = new toxi.geom.mesh.SphericalHarmonics( m ),
            mesh = new toxi.geom.mesh.SurfaceMeshBuilder( sh ),
            toxiMesh = mesh.createMesh( new toxi.geom.mesh.TriangleMesh(), meshResolution, 1, true ),
            threeMesh = toxiToThreeSupport.addMesh( toxiMesh, material );

        threeMesh.scale.set( scale, scale, scale );
        // threeMesh.doubleSided = true;

        this.add(threeMesh);
    };
    ToxiElement.prototype = new THREE.Object3D();

    ToxiElement.prototype.constructor = THREE.ToxiElement;

    return ToxiElement;
});
