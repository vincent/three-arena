define('threearena/elements/aboveheadmark',
  ['lodash', 'threejs'], function(_, THREE) {

  /**
   * @exports threearena/elements/abovemark
   */
  var AboveMark = function(options) {

    var self = this;
    
    THREE.Object3D.apply(this);
    self.position.y = 20;
    self.scale.set( .6, .6, .6 );

    options = options || {};

    var material = new THREE.MeshBasicMaterial({ color:'#FFD100' });

    var loader = new THREE.JSONLoader();
    loader.load('/gamedata/models/markers/abovehead_sims.js', function ( geometry ) {
      
      var object = new THREE.Mesh( geometry, material );
      self.add(object);

      options.onLoad && options.onLoad();
    });
  };
  AboveMark.prototype = new THREE.Object3D();

  AboveMark.prototype.update = function(data) {
  };

  AboveMark.prototype.constructor = THREE.AboveMark;

  return AboveMark;
});
