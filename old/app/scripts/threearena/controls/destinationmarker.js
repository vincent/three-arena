define('threearena/controls/destinationmarker',
  ['lodash', 'threejs', 'threearena/shaders/lightbolt'], function(_, THREE, DestinationMarkerMaterial) {

  /**
   * @exports threearena/spell/destinationmarker
   * 
   * @constructor
   */
  var DestinationMarker = function(options) {

    THREE.Object3D.apply(this);

    this.material = new DestinationMarkerMaterial()

    this.plane = new THREE.Mesh( new THREE.PlaneGeometry( 6, 6 ), this.material );
    this.plane.rotation.z = 90 * Math.PI / 180;
    // this.plane.position.y *= - .5;
    // this.plane.position.x *= - .5;
    this.plane.position.y = 6;

    this.add(this.plane);
  };

  DestinationMarker.prototype = Object.create(THREE.Object3D.prototype);

  ///////////////////

  DestinationMarker.prototype.animate = function () {
    var self = this;

    self.plane.visible = true;

    var update = function(game){
      self.material.uniforms.time.value += game.delta; // * 100 * Math.PI / 180;
    };

    window._ta_events.bind('update', update);
    setTimeout(function(){
      window._ta_events.unbind('update', update);
      self.plane.visible = false;
    }, 300);

    return;


    self.plane.scale.set(1, 1, 1);

    self.tween = new TWEEN.Tween(self.plane.scale)
      .to({ x: .5, y: .5 }, 300)
      .easing( TWEEN.Easing.Elastic.InOut )
      .onUpdate(function(){
        self.plane.material.uniforms.time.value += .001;
      })
      .onComplete(function(){
        self.plane.visible = false;
      })
      .start();
  };

  ///////////////////

  DestinationMarker.prototype.constructor = DestinationMarker;
  return DestinationMarker;
});
