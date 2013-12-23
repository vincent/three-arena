'use strict';

var _ = require('lodash');
var tic = require('tic')();
var async = require('async');
var TWEEN = require('tween');
var Stats = require('./vendor/stats');
var Detector = require('./vendor/detector');
var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
var interact = process.browser ? require('interact') : null;
// var requestAnimationFrame = require('raf');

var Machine = require('./node_modules/machinejs/build/machine.build.js');


var HUD = require('./lib/hud');
var Utils = require('./lib/utils');
var Entity = require('./lib/entity');
var LifeBar = require('./lib/elements/slifebar');
var DestinationMarker = require('./lib/controls/destinationmarker');
var Terrain = require('./lib/elements/terrain');
var InteractiveObject = require('./lib/elements/interactiveobject');
var PathFinding = require('./lib/pathfinding/recast').Module;
var CameraControls = require('./lib/controls/dota');

module.exports = Arena;

/**
 * The main game class
 * 
 * @exports Arena
 * 
 * @constructor
 * 
 * @param {object} settings
 * @param {string} settings.container Game container #id
 * @param {string} settings.splashContainer Game splashscreen, to be hidden when the game will start
 * 
 * @param {number=} settings.speed Game speed. Accelerated > 1 > Deccelerated
 * 
 * @param {object=} settings.fog Fog settings
 * @param {colorstring=} settings.fog.color Fog color
 * @param {number=} settings.fog.near Fog near
 * @param {number=} settings.fog.far Fog far
 * 
 * @param {object=} settings.hud HUD settings
 * @param {number=} settings.hud.mouseBorderDetection Border percentage after which the camera moves, set to false to disable
 *
 * @param {object=} settings.debug Debugging settings
 * @param {boolean=} settings.debug.showRoutes Show character routes as they are created
 * @param {boolean=} settings.debug.visibleCharactersBBox Show characters bounding boxes
 * 
 */
var Arena = function (settings) {

  // FIXME
  window._ta_events = new EventEmitter();

  var self = this;

  /**
   * The game settings
   * @type {Object}
   */
  this.settings = _.defaults(settings, {

    preload: [],

    fog: {
      color: 0x000000,
      near: 20,
      far: 250
    },

    lights: {
      ambientColor: 0x050505,
      pointColor: 0x050505,
      directionalColor: 0xaaaaaa
    },

    speed: 1,

    keys: {
      MOVE_BUTTON: 2,
      BEGIN_SELECTION: 0
    },

    hud: {
      mouseBorderDetection: 20,
    },

    cameraFollowsPlayer: true, // if true camera will follow the main character as it moves
    cameraHeight: 80,

    showRoutes: false,
    visibleCharactersBBox: false,

    container: null,
    splashContainer: null,

    positions: {
      origin: new THREE.Vector3( 0, 0, 0 )
    },

  }, settings);

  //////////

  /**
   * True if the game has started 
   * @type {Boolean}
   */
  this._started = false;

  /**
   * The unique detination marker, repositioned on every moves
   * @type {DestinationMarker}
   */
  this.destinationMarker = new DestinationMarker(this);

  /**
   * The game clock
   * @type {THREE.Clock}
   */
  this.clock = new THREE.Clock();

  /**
   * Each team objectives
   * @type {Object}
   */
  this.objectives = {
    0: null,  // team 2 objective
    1: null,  // team 1 objective
  };

  /**
   * The terrain
   * @type {Terrain}
   */
  this.ground = null;

  /**
   * Current selection callback, or null if no selection is waited
   * @type {Function}
   */
  this._waitForSelection = null;

  /**
   * Characters
   * @type {Array}
   */
  this.pcs = [];

  /**
   * All intersectable objects
   * @type {Array}
   */
  this.intersectObjects = [];

  /**
   * The state machine enine
   * @type {Machine}
   */
  this.machine = new Machine();

  /**
   * Parent of all helpers
   * @type {THREE.Object3D}
   */
  this.helpers = new THREE.Object3D();

  /**
   * The game HUD
   * @type {HUD}
   */
  this.hud = new HUD.GameHud('hud-container');

  //////////

  this.stats = new Stats();
  this.stats.domElement.style.position = 'absolute';
  this.stats.domElement.style.top = '0px';
  this.settings.container.appendChild( this.stats.domElement );

  /**
   * The dat.GUI instance 
   * @type {dat.GUI}
   */
  this.gui = new dat.GUI();
  this.gui.close();

  //////////

  this._initScene(function () { });
  
  //////////

  this.on('set:terrain', function(){

    _.each(self.pcs, function(obj){
      self.groundObject(obj);
    });

    // depends on terrain size
    self._clampCameraToGround();
  });
};

inherits(Arena, EventEmitter);

/**
 * Init the pathfinding subsystem, and load its settings.preload urls
 * 
 * @param  {Function} callback called when finished
 */
Arena.prototype.preload = function(done) {

  var self = this;

  if (this.settings.preload.length > 0) {

    async.parallel(this.settings.preload, function() {
      self.settings.preload.length = 0;
      done();
    });

  } else {
    done();
  }
};

/**
 * Init the game, reset characters and map elements
 * 
 * @param  {Function} callback called when ready to run
 * 
 * @fires module:threearena/game#ready
 */
Arena.prototype.init = function(ready) {

  var self = this;

  async.series([

    function(done){
      async.parallel([

        function(pdone){ self._initCamera(pdone); },  // camera

        function(pdone){ self._initLights(pdone); },  // lights

        function(pdone){ self._initRenderer(pdone); },// lights

      ], done);
    },

    function(done){ self.hud.attachGame(self); done(); }, // attach HUDs

    function(done){ self._initSky(done); },   // sky needs terrain

    function(done){ self._setupGui(done); },  // gui needs everything to be set

    function(done){ self.emit('ready', self); done(); },

  ], function(){ ready(self); });
};

/**
 * Init the game camera
 * 
 * @private
 */
Arena.prototype._initCamera = function(done) {

  var dims = this.getContainerDimensions();

  this.camera = new THREE.PerspectiveCamera( 50, dims.width / dims.height, 1, 10000 );

  this.emit('set:camera');

  done();
};

/**
 * Init scene
 * 
 * @private
 */
Arena.prototype._initScene = function(done) {

  this.scene = new THREE.Scene();
  this.scene.fog = new THREE.Fog( this.settings.fog.color, this.settings.fog.near, this.settings.fog.far );

  this.scene.add(this.destinationMarker);
  this.scene.add(this.helpers);

  this.scene2 = new THREE.Scene();
  this.scene.fog = new THREE.Fog( this.settings.fog.color, this.settings.fog.near, this.settings.fog.far );

  this.emit('set:scene');

  done();
};

/**
 * Init global game lights
 * 
 * @private
 */
Arena.prototype._initLights = function(done) {

  this.frontAmbientLight = new THREE.AmbientLight( 0xffffff );
  this.scene2.add( this.frontAmbientLight );

  this.ambientLight = new THREE.AmbientLight( 0x050505 );
  this.scene.add( this.ambientLight );

  // SpotLight( hex, intensity, distance, angle, exponent )
  // PointLight( hex, intensity, distance )

  /*
  this.pointLight = new THREE.PointLight( 0xffffff, 1, 100 ); //, Math.PI );
  this.pointLight.shadowCameraVisible = true;
  this.pointLight.position.set( -20, 0, 20 );
  */

  this.pointLight = new THREE.SpotLight( 0xffffff, 1, 100, Math.PI );
  this.pointLight.shadowCameraVisible = true;
  this.pointLight.shadowCameraNear = 10;
  this.pointLight.shadowCameraFar = 100;
  this.pointLight.position.set( 0, 180, 0 );
  this.pointLight.intensity = 5;
  this.pointLight.distance = 250;
  this.pointLight.angle = 0.5;
  this.pointLight.exponent = 40;
  this.pointLight.ambient = 0xffffff;
  this.pointLight.diffuse = 0xffffff;
  this.pointLight.specular = 0xffffff; // new THREE.Color('#050101'); // 0xaaaa22;
  this.scene.add(this.pointLight);



  this.directionalLight = new THREE.SpotLight( 0xffffff, 1, 800 );
  this.directionalLight.ambient = 0xffffff;
  this.directionalLight.diffuse = 0xffffff;
  this.directionalLight.specular = 0xffffff; // new THREE.Color('#050101'); // 0xaaaa22;

  this.directionalLight.position.set( -200, 400, -200 );
  this.directionalLight.intensity = 2;
  this.directionalLight.castShadow = true;
  this.directionalLight.shadowMapWidth = 1024;
  this.directionalLight.shadowMapHeight = 1024;
  this.directionalLight.shadowMapDarkness = 0.95;
  this.directionalLight.shadowCameraVisible = true;
  this.scene.add( this.directionalLight );

  this.emit('set:lights');

  done();
};

/**
 * Init the renderer
 * 
 * @private
 */
Arena.prototype._initRenderer = function(done) {

  var dims = this.getContainerDimensions();

  this.renderer = new THREE.WebGLRenderer();
  this.renderer.shadowMapEnabled = true;
  this.renderer.shadowMapSoft = true;
  //this.renderer.shadowMapType = THREE.PCFSoftShadowMap;

  this.renderer.shadowCameraNear = 3;
  this.renderer.shadowCameraFar = this.camera.far;
  this.renderer.shadowCameraFov = 50;

  this.renderer.autoClear = false;
  this.renderer.gammaInput = true;
  this.renderer.gammaOutput = true;
  this.renderer.physicallyBasedShading = true;

  // this.renderer.shadowMapBias = 0.0039;
  // this.renderer.shadowMapDarkness = 0.5;
  // this.renderer.shadowMapWidth = dims.width;
  // this.renderer.shadowMapHeight = dims.height;

  this.renderer.setClearColor( this.scene.fog.color, 1 );

  this.renderer.setSize( dims.width, dims.height);

  this._effectsPass = {
    renderModel  : new THREE.RenderPass( this.scene, this.camera ),
    effectBleach : new THREE.ShaderPass( THREE.BleachBypassShader ),
    effectColor  : new THREE.ShaderPass( THREE.ColorCorrectionShader ),
    effectFXAA   : new THREE.ShaderPass( THREE.FXAAShader )
  };

  this._effectsPass.renderModel.name = 'renderModel';
  this._effectsPass.effectBleach.name = 'effectBleach';
  this._effectsPass.effectColor.name = 'effectColor';
  this._effectsPass.effectFXAA.name = 'effectFXAA';

  this._effectsPass.effectFXAA.uniforms.resolution.value.set( 1 / dims.width, 1 / dims.height );
  this._effectsPass.effectBleach.uniforms.opacity.value = 0.2;
  this._effectsPass.effectColor.uniforms.powRGB.value.set( 1.4, 1.45, 1.45 );
  this._effectsPass.effectColor.uniforms.mulRGB.value.set( 1.1, 1.1, 1.1 );
  this._effectsPass.effectFXAA.renderToScreen = true;

  this.composer = new THREE.EffectComposer( this.renderer );
  this.composer.addPass( this._effectsPass.renderModel );
  this.composer.addPass( this._effectsPass.effectBleach );
  this.composer.addPass( this._effectsPass.effectColor );
  this.composer.addPass( this._effectsPass.effectFXAA );

  this.settings.container.appendChild( this.renderer.domElement );

  // CONTROLS

  //this.cameraControls = new THREE.TrackballControls( this.camera, this.renderer.domElement );
  this.cameraControls = new CameraControls( this.camera, this.renderer.domElement, this.settings.hud );
  this.cameraControls.domElement = this.renderer.domElement;

  this.emit('set:renderer');

  done();
};

/**
 * Clamp the camera movement to the ground boundings
 * 
 * @private
 */
Arena.prototype._clampCameraToGround = function() {

  if (this.cameraControls) {
    this.cameraControls.clamp = {
      xmin: this.ground.boundingBox.min.x * 0.9,
      xmax: this.ground.boundingBox.max.x * 0.9,
      zmin: this.ground.boundingBox.min.z * 0.9 + 30,
      zmax: this.ground.boundingBox.max.z * 0.9 + 50
    };
  }
};

/**
 * Init the skybox
 * 
 * @private
 * @param  {Function} done called when finished
 */
Arena.prototype._initSky = function(done) {
  var urlPrefix = '/gamedata/skybox/darkred_';
  var urls = [
    urlPrefix + 'posx.jpg', urlPrefix + 'negx.jpg',
    urlPrefix + 'posy.jpg', urlPrefix + 'negy.jpg',
    urlPrefix + 'posz.jpg', urlPrefix + 'negz.jpg'
  ];
  var textureCube = THREE.ImageUtils.loadTextureCube( urls );

  var shader = THREE.ShaderLib['cube'];
  var uniforms = THREE.UniformsUtils.clone( shader.uniforms );
  uniforms['tCube'].value = textureCube;
  var material = new THREE.ShaderMaterial({
    fragmentShader: shader.fragmentShader,
    vertexShader: shader.vertexShader,
    uniforms: uniforms,
    depthWrite: false
  });

  this.on('set:terrain', function(terrain){

    // build the skybox Mesh 
    var skyboxMesh = new THREE.Mesh( new THREE.CubeGeometry( 1000, 1000, 1000 ), material );
    skyboxMesh.flipSided = true;
    // tskyboxMesh.renderDepth = 1e20;
    this.scene.add( skyboxMesh );
  });

  done();
};

/**
 * Setup the basic options GUI
 * 
 * @private
 * @param  {Function} done called when finished
 */
Arena.prototype._setupGui = function(done) {
  var self = this, folder, slider;

  folder = self.gui.addFolder('Renderer');
  for (var i = 0; i < self.composer.passes.length; i++) {
    folder.add(self.composer.passes[i], 'enabled');
    self.gui.__folders.Renderer.__controllers[i].name(self.composer.passes[i]._name);
  }

  folder = self.gui.addFolder('Lights');

  slider = folder.addColor(self.settings.lights, 'ambientColor');
  slider.onChange(function(value){
    self.ambientLight.color.set( value );
  });

  slider = folder.addColor(self.settings.lights, 'pointColor');
  slider.onChange(function(value){
    self.pointLight.color.set( value );
  });
  folder.add(self.pointLight, 'intensity', 0.001, 10);
  folder.add(self.pointLight, 'distance', 0.001, 1000);
  folder.add(self.pointLight, 'angle', 0, Math.PI * 2);
  folder.add(self.pointLight, 'exponent', 0.001, 100);

  slider = folder.addColor(self.settings.lights, 'directionalColor');
  slider.onChange(function(value){
    self.directionalLight.color.set( value );
  });
  folder.add(self.directionalLight, 'intensity', 0.001, 10);
  folder.add(self.directionalLight, 'distance', 0.001, 1000);
  folder.add(self.directionalLight, 'angle', 0, Math.PI * 2);
  folder.add(self.directionalLight, 'exponent', 0.001, 100);

  folder = self.gui.addFolder('Fog');
  folder.add(self.scene.fog, 'near');
  folder.add(self.scene.fog, 'far');

  folder = self.gui.addFolder('Controls');
  folder.add(self.cameraControls, 'mouseEnabled');

  done();
};


// # Debugging methods

Arena.prototype.addMarker = function(position) {
  var geometry = new THREE.SphereGeometry( 0.1, 10, 10 );
  var material = new THREE.MeshPhongMaterial( { color: 0xffffff, shading: THREE.FlatShading } );
  var mesh = new THREE.Mesh( geometry, material );
  mesh.position.copy(position);
  this.scene.add(mesh);
};

// # Misc internal methods

Arena.prototype.setInterval = tic.interval.bind(tic);
Arena.prototype.setTimeout = tic.timeout.bind(tic);

// teardown methods
Arena.prototype.destroy = function() {
  clearInterval(this.timer);
};

/**
 * Attach a listener for the next selection. There can be only one listener.
 * 
 * @param  {Function} onSelection
 */
Arena.prototype.waitForSelection = function(onSelection) {

  this._waitForSelection = onSelection;
};

/**
 * Cast a Raycaster in camera space
 * 
 * @param  {Array} objects specify which objects to raycast against, all intersectables object by default
 * @return {object} An intersections object
 *
 * @example
 * window.onClick = function ( event ) {
 *   var inter = game.raycast( event, candidates );
 *   console.log( "ray intersects %d objects, first one in sight is %o (face %o) at %o",
 *       inter.length, inter[0].object, inter[0].face, inter[0].point );
 * }
 */
Arena.prototype.raycast = function( event, objects ) {

  objects = objects || this.intersectObjects;

  if (! this._raycasterVector) {
    this._raycasterVector = new THREE.Vector3();
  }

  var dims = this.getContainerDimensions();

  this._raycasterVector.set(
     (event.clientX / dims.width) * 2 - 1,
    -(event.clientY / dims.height) * 2 + 1,
    this.camera.near
  );

  if (! this._projector) {
    this._projector = new THREE.Projector();
  }

  this._projector.unprojectVector(this._raycasterVector, this.camera);

  this._raycaster = new THREE.Raycaster(this.camera.position, this._raycasterVector.sub(this.camera.position).normalize());

  var intersects = this._raycaster.intersectObjects(objects, true); // recursive

  return intersects;
};

////////////////////////////////

/**
 * Get the game container dimensions
 * 
 * @return {object} { width:W, height:H }
 */
Arena.prototype.getContainerDimensions = function() {

  var $container = this._started ? $(this.settings.container) : $(window);

  return {
    width: $container.outerWidth(),
    height: $container.outerHeight()
  };
};

/**
 * Set listeners to play the game in the browser
 * 
 * @private
 */
Arena.prototype._initListeners = function() {

  this.settings.container.addEventListener('mouseup', _.bind( this._onDocumentMouseUp, this), false);
  this.settings.container.addEventListener('mousedown', _.bind( this._onDocumentMouseDown, this), false);
  this.settings.container.addEventListener('mousemove', _.bind( this._onDocumentMouseMove, this), false);
  this.settings.container.addEventListener('mousewheel', _.bind( this._onMouseScroll, this ), false );
  this.settings.container.addEventListener('DOMMouseScroll', _.bind( this._onMouseScroll, this ), false ); // firefox

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', _.bind( this._onWindowResize, this), false);
  }
};

/**
 * Test a key against the specified binding
 * @param  {literal} value  Value to be tested
 * @param  {string} key Binding name: 
 * @return {boolean} True if the value match the specified binding name config 
 */
Arena.prototype._testKey = function(value, key) {

  var test = this.settings.keys[key];

  if (_.isArray(test)) {
    return this.settings.keys[key].indexOf(event.button);

  } else if (_.isFunction(test)) {
    return this.settings.keys[key](event.button);

  } else {
    return this.settings.keys[key] === event.button;
  }
};

/**
 * Resize listener
 * 
 * @private
 */
Arena.prototype._onWindowResize = function() {

  var dims = this.getContainerDimensions();

  var windowHalfX = dims.width / 2;
  var windowHalfY = dims.height / 2;
  this.camera.aspect = windowHalfX / windowHalfY;
  this.camera.updateProjectionMatrix();
  this.renderer.setSize( dims.width, dims.height );
  this._effectsPass.effectFXAA.uniforms.resolution.value.set( 1 / dims.width, 1 / dims.height );
};

/**
 * Mouse scroll listener
 * 
 * @private
 */
Arena.prototype._onMouseScroll = function(event) {

  this.settings.cameraHeight = Math.max(50, this.settings.cameraHeight - event.wheelDeltaY * 0.01);
};

/**
 * Mouse click listener
 * 
 * @private
 */
Arena.prototype._onDocumentMouseUp = function(event) {

  var self = this;
  //event.preventDefault();

  var intersects = self.raycast(event, self.intersectObjects);

  if (intersects.length > 0) {

    var ipos = intersects[0].point,
        entity;

    // console.log('intersect at %o %o', ipos.x, ipos.y, ipos.z );

    var character = self.pcs[0];

    // ends a ground selection
    if (self._inGroundSelection) {

      var selection = {
        begins: self._inGroundSelection.ground,
        ends: intersects[0].point
      };

      self._inGroundSelection = null;
      $('#selection-rectangle').hide();

      self.unselectCharacters();
      self.selectCharactersInZone(selection.begins, selection.ends);

    // Mark some polys as not walkable
    } else if (event.button === 0 && event.shiftKey && intersects[0].object.parent && Utils.childOf(intersects[0].object.parent, Terrain)) {

      PathFinding.setPolyUnwalkable(
        ipos.x, ipos.y, ipos.z,
        5, 5, 5,
        0
      );

    } else if (self._testKey(event.button, 'MOVE_BUTTON') && intersects[0].object.parent && Utils.childOf(intersects[0].object.parent, Terrain)) {

      self.endAllInteractions();

      self.destinationMarker.position.copy(ipos);
      self.destinationMarker.animate();

      if (character) {
        console.log('find a path between %o and %o', character.position, ipos);

        // character.objective = { position: ipos };
        // character.behaviour = character.behaviour.warp('plotCourseToObjective');

        var startPosition = character.position.clone();

        /*
        if (character._currentTween && character._currentTweenDestination && true) {
            startPosition.copy(character._currentTweenDestination);
        }
        character._currentTweenDestination = ipos.clone();
        */

        PathFinding.findPath(
          startPosition.x, startPosition.y, startPosition.z,
          ipos.x, ipos.y, ipos.z,
          10000,
          Utils.gcb(function(path) {
            character.moveAlong(path, {
              append: event.shiftKey,
              yoyo: event.ctrlKey
            });
          })
        );
      }

    } else if (self._waitForSelection) {

      var callback = self._waitForSelection;
      self._waitForSelection = null;
      self.unselectCharacters();

      callback(intersects);

    } else {

      // __add_tree(ipos);

      // user clicked something
      if (intersects[0].object && intersects[0].object) {

        // maybe an entity ?
        entity = Utils.childOf(intersects[0].object, Entity);

        // it's an entity
        if (entity) {

          // cast the first possible spell 
          for (var i = 0; i < character.state.spells.length; i++) {
            if (character.state.spells[i].canHit(character, entity)) {

              // character.lookAt(entity.position);
              character.cast(character.state.spells[i], entity);
              break;
            }
          }

        // it's an interactive object
        } else if (intersects[0].object.parent && intersects[0].object.parent.parent &&
            intersects[0].object.parent.parent instanceof InteractiveObject) {

          if (intersects[0].object.parent.parent.isNearEnough(character)) {
            self.startInteraction(intersects[0].object.parent.parent);

          } else {
            console.log('C\'est trop loin !');
          }
        }
      }
    }

  } else {
    console.log('no intersect');
  }
};

/**
 * MouseDown event listener
 * 
 * @private
 * @param  {Event} event
 */
Arena.prototype._onDocumentMouseDown = function(event) {

  var self = this;
  //event.preventDefault();

  // for now, just discard during a click-selection 
  if (self._waitForSelection) { return; }

  // intersect everything ... only the ground
  var intersects = self.raycast(event, self.intersectObjects);

  // .. but check if the ground if the first intersection
  // TODO: find another way to check ==ground
  if (intersects.length > 0 && self._testKey(event.button, 'BEGIN_SELECTION') && Utils.childOf(intersects[0].object.parent, Terrain)) {
    // begins a selection
    this._inGroundSelection = {
      screen: { x: event.clientX, y: event.clientY },
      ground: intersects[0].point.clone()
    };
  }
};

/**
 * MouseMove event listener
 * 
 * @private
 */
Arena.prototype._onDocumentMouseMove = function(event) {

  if (this._inGroundSelection) {
    // in a selection
    var p1 = this._inGroundSelection.screen,
        p2 = { x: event.clientX, y: event.clientY },
        posleft = p1.x > p2.x ? p2.x : p1.x,
        postop = p1.y > p2.y ? p2.y : p1.y,
        selwidth = Math.abs(p1.x - p2.x),
        selheight = Math.abs(p1.y - p2.y);

    if (selheight > 2 && selwidth > 2) {
      $('selection-rectangle').css({
        height: selheight,
        width: selwidth,
        left: posleft,
        top: postop
      }).show();
    }
  }

};

/////////////////////////////////////////
// TERRAIN

/**
 * Set the walkable terrain
 * 
 * @param {string} file Path to the .OBJ file
 * @param {object=} options Common three.js material options, plus options below (see RecastNavigation options)
 * @param {float=} options.cellSize Navmesh cell size (.8 > 2)
 * @param {float=} options.cellHeight Navmesh cell height (.5 > 1)
 * @param {float=} options.agentHeight Characters height (1.2 => 2)
 * @param {float=} options.agentRadius Characters radius (.5 > 2)
 * @param {float=} options.agentMaxClimb Max units characters can jump (1 > 5)
 * @param {float=} options.agentMaxSlope Max degre characters can climb (20 > 40)
 */
Arena.prototype.setTerrain = function(file, options) {

  var self = this;

  options = _.merge({

    cellSize: 2,            // nav mesh cell size (.8 > 2)
    cellHeight: 1.5,        // nav mesh cell height (.5 > 1)
    agentHeight: 2.0,       // character height (1.2 => 2)
    agentRadius: 0.2,       // character radius (.5 > 2)
    agentMaxClimb: 4.0,     // max units character can jump (1 > 5)
    agentMaxSlope: 30.0,    // max degre character can climb (20 > 40)

    wireframe: false,

    onLoad: null

  }, options, {
    onLoad: function(terrain) {
      self.ground = terrain;
      self.intersectObjects = self.intersectObjects.concat(self.ground.children[0].children);
      self.scene.add(self.ground);

      self.ground.traverse( function ( child ) {
        if ( child instanceof THREE.Mesh ) {
          child.receiveShadow = true;

          // use provided boundinf box if present
          if (options.boundingBox) {
            child.geometry.boundingBox = options.boundingBox;
          // or compute it
          } else if (! child.geometry.boundingBox) {
            child.geometry.computeBoundingBox();
          }
          // fast access to ground bbox
          self.ground.boundingBox = child.geometry.boundingBox;
        }
      } );


      // load the navigation mesh
      $.ajax({
        url: file,
        success: function(data) {
          window.Config = {};

          PathFinding.set_cellSize(options.cellSize);
          PathFinding.set_cellHeight(options.cellHeight);

          PathFinding.set_agentHeight(options.agentHeight);
          PathFinding.set_agentRadius(options.agentRadius);

          PathFinding.set_agentMaxClimb(options.agentMaxClimb);
          PathFinding.set_agentMaxSlope(options.agentMaxSlope);

          PathFinding.initWithFileContent(data);
          PathFinding.build();

          self.emit('set:terrain', self.ground);
        }
      });
    }
  });

  new Terrain(file, options);

  return this;
};

/**
 * Get the navigation mesh as a three.js mesh object
 *
 * Warning: you don't need this to have a walkable terrain.
 * This method is available for debugging purposes.
 * 
 * @param {function} callback Callback to be called with the produced THREE.Mesh
 */
Arena.prototype.computeNavigationMesh = function(callback) {

  var self = this;

  if (! self.navigationMesh) {
    // get the navmesh vertices
    PathFinding.getNavMeshVertices(
      Utils.gcb(function(vertices) {
        // build the mesh
        self.navigationMesh = Utils.meshFromVertices(vertices, {
          color: 0xffffff,
          wireframe: true,
          transparent: true,
          opacity: 0.8
        });
        self.scene.add(self.navigationMesh);
        if (callback) { callback(null, self.navigationMesh); }
      })
    );
  } else {
    if (callback) { callback(null, self.navigationMesh); }
  }
};

/**
 * Force an object to be grounded on the terrain surface
 *
 * @param {object} object THREE.Mesh, or any object with a position attribute.
 */
Arena.prototype.groundObject = function(object) {

  var self = this;

  if (self.ground) {
    // double-check the elevation, objects cannot be under ground
    var inifiniteElevation = new THREE.Vector3( object.position.x, 10000000, object.position.z );
    var raycaster = new THREE.Raycaster(inifiniteElevation, new THREE.Vector3(0, -1, 0));
    var intersects = raycaster.intersectObject(self.ground, true);

    if (intersects.length) {
      object.position.y = Math.max(object.position.y, intersects[intersects.length - 1].point.y);
    } else {
      throw 'object cannot be placed here';
    }
  } else {
    throw 'ground has not been set yet';
  }
};

/**
 * Get a random postion on the terrain surface.
 * 
 * @param  {Function} callback Callback to be called with the generated position
 */
Arena.prototype.randomPositionOnterrain = function(callback) {

  PathFinding.getRandomPoint(Utils.gcb(callback));
};

/**
 * Add an obstacle on the terrain surface, that will block future characters moves.
 * @param {object} position The obstacle position
 * @param {float} radius    Radius of the obstacle
 * @param {integer} flag    Walkable flags (0 will completely block moves)
 */
Arena.prototype.addObstacle = function(position, radius, flag) {
  
  if (this.settings.showObstacles) {
    var obsctacle = new THREE.Mesh( new THREE.PlaneGeometry(radius, radius, radius, 1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xff0000 }) );
    obsctacle.position.copy(position);
    obsctacle.rotation.x = 90 * Math.PI / 180;
    this.scene.add(obsctacle);
  }

  PathFinding.setPolyUnwalkable(position.x, position.y, position.z, radius, radius, radius, flag);
};


/**
 * Setup an entity before it get added in the scene
 * 
 * @param  {Entity} entity The entity to be setup
 */
Arena.prototype._prepareEntity = function(entity) {

  var self = this;

  // give entities a reference to this
  entity.game = this;

  // entities should have a lifebar
  entity.attachLifeBar();

  // casts shadows
  entity.traverse(function (child) {
    if (child instanceof THREE.Mesh && child.parent && ! child.parent instanceof LifeBar) {
      child.castShadow = true;
    }
  });

  // setup its behaviour
  if (entity.behaviour) {
    entity.behaviour = self.machine.generateTree(entity.behaviour, entity, entity.states);
    // update event
    self.on('update:behaviours', function() {
      entity.behaviour = entity.behaviour.tick();
    });
  }

  // has a collision box
  var invisibleMaterial = new THREE.MeshBasicMaterial({ wireframe: true, color: 0xffffff, transparent: true, opacity: 0.5 });
  var box = new THREE.Box3();
  box.setFromObject(entity);
  box = new THREE.Mesh(new THREE.CubeGeometry(
    box.max.x - box.min.x,
    box.max.y - box.min.y + ((box.max.y - box.min.y) * 0.20), // a bit higher to include head
    box.max.z - box.min.z,
    1, 1, 1
  ), invisibleMaterial);
  box.visible = self.settings.visibleCharactersBBox;
  entity.add(box);

  // is intersectable
  self.intersectObjects.push(box);

  // add its lifebar in the alternative scene ..
  self.scene2.add(entity.lifebar);

  self.on('update', function(game){
    entity.lifebar.update(game.delta);

    // .. always above its character
    entity.lifebar.position.copy(entity.position);
    entity.lifebar.position.y += 10;

    // .. always face camera
    entity.lifebar.rotation.y = self.camera.rotation.y;
  });

  // .. disappears whenever the character die
  entity.on('death', function(){
    if (entity.lifebar.parent) {
      entity.lifebar.parent.remove(entity.lifebar);
    }
  });

  self.emit('added:entity', entity);
};

/**
 * Add a static object
 * 
 * @param {Function(object)} builder Function to be called with the fully initialized object.
 * 
 * @fires module:threearena/game#added:static
 * 
 * @@return {this} The game object
 * 
 * @example
 * game.addStatic(function (done) {
 *   var petShop = new Shop({
 *     onload: function () { done(this); }
 *   });
 * })
 */
Arena.prototype.addStatic = function(builder) {

  var self = this;

  var add = function(object) {

    // Attach a life/mana bar above the entity
    if (object instanceof Entity) {
      self._prepareEntity(object);
    }

    if (object.isBlocking) {
      self.addObstacle(object.position, 4);
    }

    // On scene !
    self.scene.add(object);

    self.emit('added:static', object);
  };

  // argument is already an object, add it now
  if (! _.isFunction(builder)) {
    add(builder);

  // argument is a builder function, but game has already been started, build it now
  } else if (self._started) {
    builder(add, self);

  // argument is a builder function, and game has not been started, build it later
  } else {
    self.settings.preload.push(function(done){
      builder(function(object){
        add(object);
        done();
      }, self);
    });
  }

  return this;
};


/////////////////////////////////////////
// INTERACTIVES

/**
 * Add an interactive object
 * 
 * @param {InteractiveObject} builder Interactive Object
 * @param {object} options Options
 * 
 * @fires module:threearena/game#added:interactive
 * 
 * @@return {this} The game object
 */
Arena.prototype.addInteractive = function(builder) {

  var self = this;

  var add = function(object) {
    self.intersectObjects.push(object);

    // On scene !
    self.scene.add(object);
  };

  // argument is already an object, add it now
  if (! _.isFunction(builder)) {
    add(builder);

  // argument is a builder function, but game has already been started, build it now
  } else if (self._started) {
    builder(add, self);

  // argument is a builder function, and game has not been started, build it later
  } else {
    self.settings.preload.push(function(done){
      builder(function(object){
        add(object);
        done();
      }, self);
    });
  }

  return this;
};

/**
 * End all not-near-enough interaction
 * 
 * @@return {this} The game object
 */
Arena.prototype.endAllInteractions = function () {

  var character = this.pcs[0];
  
  _.each(this._selected_objects, function (object) {
    if (object.isNearEnough && ! object.isNearEnough(character)) {
      object.deselect();
    }
  });

  return this;
};

/**
 * Begin a new interaction with an interactive object
 *
 * @param  {InteractiveObject} interactiveObject
 * 
 * @@return {this} The game object
 */
Arena.prototype.startInteraction = function (interactiveObject) {

  this.endAllInteractions();
  this._selected_objects.push(interactiveObject);
  interactiveObject.select();
  this.hud.startInteraction(interactiveObject);

  return this;
};


/////////////////////////////////////////
// CHARACTERS

/**
 * Add a character. The first one is the main one
 * 
 * @param {Function(object)} builder Function to be called with the fully initialized object.
 *
 * @@return {this} The game object
 * 
 * @example
 * game.addCharacter(function (done) {
 *   var character = new Ogro({
 *     onload: function () { done(this); }
 *   });
 * })
 * 
 * @fires module:threearena/game#added:entity
 */
Arena.prototype.addCharacter = function(builder) {

  var self = this;

  var add = function(object) {

    // characters are always grounded
    if (self.ground) {
      self.groundObject(object);
    }

    // Attach a life/mana bar above the entity
    self._prepareEntity(object);

    self.pcs.push(object);

    // On scene !
    self.scene.add(object);

    self.emit('added:character', object);
  };

  // argument is already an object, add it now
  if (! _.isFunction(builder)) {
    add(builder);

  // argument is a builder function, but game has already been started, build it now
  } else if (self._started) {
    builder(add, self);

  // argument is a builder function, and game has not been started, build it later
  } else {
    self.settings.preload.push(function(done){
      builder(function(object){
        add(object);
        done();
      }, self);
    });
  }

  return this;
};

/**
 * Remove a character from the scene
 * 
 * @param  {Entity} character
 * 
 * @@return {this} The game object
 * 
 * @fires module:threearena/game#removed:entity
 */
Arena.prototype.removeCharacter = function(character) {

  this.pcs = _.without(this.pcs, character);
  this.scene.remove(character);

  return this;
};

Arena.prototype.asPlayer = function(entity) {

  this.hud.attachEntity(entity);
  this.camera.position.set( entity.position.x + 30, 50, entity.position.z + 40 );
};

/**
 * Current selected objects
 *
 * @private
 * @type {Array}
 */
Arena.prototype._selected_objects = [ ];

/**
 * Deselect all selected characters
 * 
 * @param  {Array} butCharacters These characters should not be deselected
 * 
 * @@return {this} The game object
 *
 * @fires module:threearena/game#unselect:all
 */
Arena.prototype.unselectCharacters = function () {

  var self = this;
  var unselected = [];

  for (var i = 0; i < this._selected_objects.length; i++) {
    if (this._selected_objects[i]._marker) {
      this._selected_objects[i].remove(this._selected_objects[i]._marker);
    }
  }
  
  this._selected_objects.length = 0;
  self._waitForSelection = null;
  this._inGroundSelection = null;
  $('#selection-rectangle').hide();

  self.emit('unselect:all', unselected);

  return this;
};

/**
 * Select all characters in a zone and return them. This method ignores Y component.
 * 
 * @param  {Vector3} start Top left point of the select area
 * @param  {Vector3} end Bottom right point of the select area
 * 
 * @return {Array} Array of selected characters
 * 
 * @fires module:threearena/game#select:entities
 */
Arena.prototype.selectCharactersInZone = function (start, end) {

  var self = this;

  var selected = _.filter(this.pcs, function(character) {
    var itsin = ! character.isDead() &&
        character.position.x > start.x && character.position.z > start.z &&
        character.position.x < end.x && character.position.z < end.z;

    if (itsin) {
      self._selected_objects.push(character);
      var marker = new SelectMarker({
        onLoad: function(){
          character._marker = marker;
          character.add(marker);
        }
      });
    }

    return itsin;
  });

  console.log('Need to find characters in %o > %o : %o', start, end, selected);

  self.emit('select:entities', selected);

  return selected;
};


/////////////////////////////////////////
// SPAWNING POOLS

/**
 * Add a spawning pool
 * 
 * @param {SpawningPool} pool spawning pool
 * 
 * @@return {this} The game object
 * 
 * @fires module:threearena/game#added:spawningpool
 */
Arena.prototype.addSpawningPool = function(pool) {

  var self = this;

  this.scene.add(pool);
  pool.on('spawnedone', function(character){
    character.position.copy(pool.position);
    self.addCharacter(character);
  });

  self.emit('added:spawningpool', pool);

  return this;
};


/////////////////////////////////////////
// GAME FLOW

/**
 * Start a new game
 *
 * @@return {this} The game object
 * 
 * @fires module:threearena/game#start
 */
Arena.prototype.start = function() {

  var self = this;

  self.preload(function(){

    self._initListeners();

    self.hud.open();

    self.emit('start');

    if (self.settings.splashContainer) {
      self.settings.splashContainer.className += ' animated fadeOutUpBig';
    }
    self.settings.container.style.className += ' animated fadeInUpBig';
    self.settings.container.style.display = 'block';

    self._started = true;

    self._boundAnimate = _.bind( self.animate, self );
    self.animate();

    // timers
    self._behaviours_delta = self.clock.getDelta();

  });

  return this;
};

/**
 * The render loop
 */
Arena.prototype.animate = function() {

  window.requestAnimationFrame( this._boundAnimate );
  this.render();
};

/**
 * Where things are rendered, inside the render loop
 * 
 * @fires module:threearena/game#update
 * @fires module:threearena/game#update:behaviours
 */
Arena.prototype.render = function() {

  var self = this;

  this.delta = this.clock.getDelta() * this.settings.speed;

  if (this.clock.oldTime - this._behaviours_delta > 100) {
    this._behaviours_delta = this.clock.oldTime;
    this.emit('update:behaviours', this);
  }

  window._ta_events.emit('update', this);

  this.emit('update', this);

  tic.tick(this.delta);
  this.cameraControls.update(this.delta);

  // camera height ~ crraaaapp
  this.camera.position.y = this.settings.cameraHeight;

  if (this.pcs.length > 0) {

    // place a light near the main player
    this.pointLight.position.set(
      this.pcs[0].position.x - 50,
      180,
      this.pcs[0].position.z + 100
    );
    this.pointLight.target = this.pcs[0];

    // camera height ~ crraaaapp
    this.camera.position.y = this.pcs[0].position.y + this.settings.cameraHeight;
  }


  _.each(this.pcs, function(character){
    character.update(self);
  });

  // FIXME: Use this.speed
  TWEEN.update();

  // render scene
  this.renderer.clear();
  this.composer.render();

  // clear depth buffer & render front scene
  this.renderer.clear( false, true, false );
  this.renderer.render( this.scene2, this.camera );

  this.stats.update();
};


/////////////////////////////////////////
// UNITY - LIKE

/**
 * Finds a game object by name and returns it.
 * 
 * @param name Name of object
 */
Arena.prototype.find = function(name) {
  return this.scene.getObjectByName(name);
};

/**
 * Finds all game objects tagged tag.
 *
 * @param tag tag name
 */
Arena.prototype.findAllWithTag = function(tag) {
  var found = [];

  this.scene.traverse(function (child) {
    if (child.tags && child.tags.indexOf(tag) > -1) {
      found.push(child);
    }
  });

  return found;
};

/**
 * Finds all game objects tagged tag and returns the first one.
 *
 * @param tag tag name
 */
Arena.prototype.findWithTag = function(tag) {
  var found = this.findAllWithTag(tag);
  return found.length > 0 ? found[0] : null;
};

/////////////////////////////////////////

/**
 * Fired when the game is ready to be started
 *
 * @event module:threearena/game#ready
 * @type {object}
 */

/**
 * Fired when the game start
 *
 * @event module:threearena/game#start
 * @type {object}
 */

/**
 * Fired on every frame
 *
 * @event module:threearena/game#update
 * @type {Game}
 * @property {float} delta Delta time
 */

/**
 * Fired every some frames
 *
 * @event module:threearena/game#update:behaviours
 * @type {Game}
 * @property {float} delta Delta time
 */

/**
 * Fired when an entity has been added
 *
 * @event module:threearena/game#added:entity
 * @type {Entity}
 */

/**
 * Fired when a static object has been added
 *
 * @event module:threearena/game#added:static
 * @type {Object}
 */

/**
 * Fired when a spawning pool has been added
 *
 * @event module:threearena/game#added:spawningpool
 * @type {SpawningPool}
 */


if (window) { window.Arena = Arena; }

Arena.Behaviours = require('./lib/behaviours/all');
Arena.Characters = require('./lib/character/all');
Arena.Elements = require('./lib/elements/all');
Arena.Spells = require('./lib/spell/all');
