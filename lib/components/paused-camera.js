'use strict';

var TrackballControls = require('three.trackball');

var settings = require('../settings');

module.exports = function (arena) {

  var controls     = null;

  var cameraType   = settings.data.cameraType;

  var cameraQuad     = null;
  var cameraPosition = null;
  var cameraScale    = null;


  function saveCamera () {
    cameraType     = settings.data.cameraType;
    cameraQuad     = arena.camera.quaternion.clone();
    cameraPosition = arena.camera.position.clone();
    cameraScale    = arena.camera.scale.clone();
  }

  function restoreCamera () {
    settings.data.cameraType = cameraType;
    arena.camera.quaternion.copy(cameraQuad);
    arena.camera.position.copy(cameraPosition);
    arena.camera.scale.copy(cameraScale);
    arena.camera.updateMatrix();
  }


  arena.on('set:renderer', function () {

    controls = new TrackballControls(arena.camera);

    // controls.rotateSpeed = 1.0;
    // controls.zoomSpeed = 1.2;
    // controls.panSpeed = 0.8;

    // controls.noZoom = false;
    // controls.noPan = false;

    // controls.staticMoving = true;
    // controls.dynamicDampingFactor = 0.3;

    controls.keys = [ 65, 83, 68 ];

    controls.enabled = false;
  });


  arena.on('paused', function () {

    // enable controls
    controls.enabled = true;
    controls.install();

    saveCamera();

    // force manual camera
    settings.data.cameraType = settings.CAMERA_MANUAL;
  });


  arena.on('resumed', function () {

    // disable controls
    controls.enabled = false;
    controls.dispose();

    restoreCamera();

    // restore camera type
    cameraType = settings.data.cameraType;
  });


  arena.on('render', function () {
    if (controls && controls.enabled) {
      controls.update();
    }
  });

};

