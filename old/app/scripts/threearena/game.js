/**
 * @module threearena/game
 */
define('threearena/game',
    ['lodash', 'async', 'threejs', 'tweenjs', 'zepto',

    'threearena/utils',
    'threearena/hud',
    'threearena/hud/spelltexts',
    'threearena/entity',
    'threearena/elements/terrain',
    'threearena/elements/nexus',
    'threearena/elements/slifebar',
    'threearena/elements/aboveheadmark',
    'threearena/elements/interactiveobject', 
    'threearena/particles/cloud', 
    'threearena/controls/dota',
    'threearena/controls/destinationmarker',

    //'threearena/pathfinding/recast.emcc.oem',
    '/recastnavigation/emscripten/build/recast.js', // testing 
    
    'MD2Character',
    'MD2CharacterComplex',
    'JSONLoader',
    'OBJLoader',
    'MTLLoader',
    'OBJMTLLoader',
    'ColladaLoader',
    'TrackballControls',
    'EditorControls',
    'ConvexGeometry',
    'BleachBypassShader',
    'ColorCorrectionShader',
    'CopyShader',
    'FXAAShader',
    'EffectComposer',
    'RenderPass',
    'ShaderPass',
    'MaskPass'

], function (_, async, THREE, TWEEN, $, 
 
    Utils,
    HUD,
    SpellTexts,
    Entity,
    Terrain,
    Nexus,
    LifeBar,
    SelectMarker,
    InteractiveObject,
    Particles,
    CameraControls,
    DestinationMarker,
    PathFinding
 
) {
    PathFinding = Module;
    window.__ta_utils = Utils;

    /**
     * The main game class
     * 
     * @exports threearena/game
     * 
     * @constructor
     * 
     * @param {object} settings
     * @param {string} settings.container Game container #id
     * @param {string} settings.splashContainer Game splashscreen, to be hidden when the game will start
     * @param {object=} settings.fog Fog settings
     * @param {colorstring=} settings.fog.color Fog color
     * @param {number=} settings.fog.near Fog near
     * @param {number=} settings.fog.far Fog far
     * 
     */
    var Game = function (settings) {

        var self = this;

        this.settings = _.defaults(settings, {

            preload: [],

            fog: {
                color: 0x000000,
                near: 20,
                far: 250
            },

            speed: 1,

            keys: {
                MOVE_BUTTON: 2,
                BEGIN_SELECTION: 0
            },

            hud: {
                mouseBorderDetection: 20, // border percentage after which the camera moves
            },

            cameraFollowsPlayer: true, // if true camera will follow the main character as it moves
            cameraHeight: 80,

            visibleCharactersBBox: true,

            container: null,
            splashContainer: null,

            positions: {
                origin: new THREE.Vector3( 0, 0, 0 )
            },

        }, settings);

        //////////

        MicroEvent.mixin(this);

        this._treesRefs  = [];

        this._started = false;

        this.objectives = {
            0: null,  // team 2 objective
            1: null,  // team 1 objective
        };
        this.towers = [];
        this.ground = null;
        this._waitForSelection = null;

        //////////

        var ThreeArenaGlobalEvents = function(){};
        MicroEvent.mixin(ThreeArenaGlobalEvents);

        window._ta_events = new ThreeArenaGlobalEvents();

        //////////

        this.stats = new Stats();
        this.stats.domElement.style.position = 'absolute';
        this.stats.domElement.style.top = '0px';
        this.settings.container.appendChild( this.stats.domElement );

        this.gui = new dat.GUI();
        this.gui.close();

        //////////

        this.pcs = [];
        this.intersectObjects = [];
        this.helpers = new THREE.Object3D();

        this.hud = new HUD.GameHud('hud-container');
        this.bind('set:terrain', function(){
            self.hud.attachGame(self);

            _.each(self.pcs, function(obj, index){
                self.groundObject(obj);

                if (index === 0) {
                    self.camera.position.set( obj.position.x + 30, 50, obj.position.z + 40 );
                }
            });

            // depends on terrain size
            self._clampCameraToGround();
        });

        this.spelltexts = new SpellTexts(this);

        this.destinationMarker = new DestinationMarker(this);

        this.trigger('before:init');

        //////////

        this._initCamera();

        this._initScene();

        this._initLights();

        this.clock = new THREE.Clock();

        // AXIS HELPER
        tmp = new THREE.AxisHelper( 1000 );
        tmp.position.set(0, 0, 0);
        this.helpers.add(tmp);

        // INTERSECTIONS HELPER
        var geometry = new THREE.CylinderGeometry( 0, 1, 1, 3 );
        geometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 0, 0 ) );
        geometry.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );
        tmp = new THREE.Mesh( geometry, new THREE.MeshNormalMaterial() );
        this.helpers.add(tmp);

        this._initRenderer();
    };

    /**
     * Init the pathfinding subsystem, and load its settings.preload urls with RequireJS  
     * @param  {Function} callback called when finished
     */
    Game.prototype.preload = function(done) {

        PackageLoader.instance.load({
            // These frameworks are required for the preloader to run.
            preloader: "scripts/libs/PackageLoadingBar.js",
            jQuery: "jquery",
            domParent: document.body,

        }, this.settings.preload, done);
    };

    /**
     * Init the game, reset characters and map elements
     * 
     * @param  {Function} callback called when ready to run
     * 
     * @fires module:threearena/game#ready
     */
    Game.prototype.init = function( ready ) {

        var self = this,
            tmp = null;

        //this.settings.container.innerHTML = '';

        this.trigger('before:fillmap');

        this._fillMap(function() {

            self.trigger('ready', self);

            ready();
        });
    };

    /**
     * Init the game camera
     * 
     * @private
     */
    Game.prototype._initCamera = function() {

        var dims = this.getContainerDimensions();

        this.camera = new THREE.PerspectiveCamera( 50, dims.width / dims.height, 1, 10000 );
    };

    /**
     * Init scene
     * 
     * @private
     */
    Game.prototype._initScene = function() {

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog( this.settings.fog.color, this.settings.fog.near, this.settings.fog.far );

        this.scene.add(this.destinationMarker);
        this.scene.add(this.helpers);

        this.scene2 = new THREE.Scene();
        this.scene.fog = new THREE.Fog( this.settings.fog.color, this.settings.fog.near, this.settings.fog.far );
    };

    /**
     * Init global game lights
     * 
     * @private
     */
    Game.prototype._initLights = function() {

        this.frontAmbientLight = new THREE.AmbientLight( 0xffffff );
        this.scene2.add( this.frontAmbientLight );

        this.ambientLight = new THREE.AmbientLight( 0xffffff );
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
        this.pointLight.intensity = 10;
        this.pointLight.distance = 250;
        this.pointLight.angle = .5;
        this.pointLight.exponent = 17;
        this.pointLight.ambient = 0xffffff;
        this.pointLight.diffuse = 0xffffff;
        this.pointLight.specular = 0xffffff; // new THREE.Color('#050101'); // 0xaaaa22;
        this.scene.add(this.pointLight);



        this.directionalLight = new THREE.SpotLight( 0xffffff, 1, 10000 );
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
    };

    /**
     * Init the renderer
     * 
     * @private
     */
    Game.prototype._initRenderer = function() {

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

        this._effectsPass.effectFXAA.uniforms[ 'resolution' ].value.set( 1 / dims.width, 1 / dims.height );
        this._effectsPass.effectBleach.uniforms[ 'opacity' ].value = 0.2;
        this._effectsPass.effectColor.uniforms[ 'powRGB' ].value.set( 1.4, 1.45, 1.45 );
        this._effectsPass.effectColor.uniforms[ 'mulRGB' ].value.set( 1.1, 1.1, 1.1 );
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
    };

    /**
     * Clamp the camera movement to the ground boundings
     * 
     * @private
     */
    Game.prototype._clampCameraToGround = function() {

        this.cameraControls.clamp = {
            xmin: this.groundBbox.min.x * .9, //  -90,
            xmax: this.groundBbox.max.x * .9, //   90,
            zmin: this.groundBbox.min.z * .9 + 30, //  -30,
            zmax: this.groundBbox.max.z * .9 + 50, //  170,
        };
    };

    /**
     * Init the skybox
     * 
     * @private
     * @param  {Function} done called when finished
     */
    Game.prototype._initSky = function(done) {
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

        this.bind('set:terrain', function(terrain){

            terrain.geometry.boundingBox || terrain.geometry.computeBoundingBox();
            var bbox = terrain.geometry.boundingBox;

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
     * @param  {Function} callback called when finished
     */
    Game.prototype._setupGui = function(callback) {
        var self = this;

        folder = self.gui.addFolder('Renderer');
        for (var i = 0; i < self.composer.passes.length; i++) {
            folder.add(self.composer.passes[i], 'enabled');
            self.gui.__folders.Renderer.__controllers[i].name(self.composer.passes[i]._name);
        }

        folder = self.gui.addFolder('Lights');
        folder.addColor(self.ambientLight, 'color');
        folder.addColor(self.pointLight, 'color');
        folder.add(self.pointLight, 'intensity', 0.001, 10);
        folder.add(self.pointLight, 'distance', 0.001, 1000);
        folder.add(self.pointLight, 'angle', 0, Math.PI * 2);
        folder.add(self.pointLight, 'exponent', 0.001, 100);
        folder.addColor(self.directionalLight, 'color');
        folder.add(self.directionalLight, 'intensity', 0.001, 10);
        folder.add(self.directionalLight, 'distance', 0.001, 1000);
        folder.add(self.directionalLight, 'angle', 0, Math.PI * 2);
        folder.add(self.directionalLight, 'exponent', 0.001, 100);

        folder = self.gui.addFolder('Fog');
        folder.add(self.scene.fog, 'near');
        folder.add(self.scene.fog, 'far');

        folder = self.gui.addFolder('Controls');
        folder.add(self.cameraControls, 'mouseEnabled');

        self.gui.add(self.helpers, 'visible');
        /*
        folder = self.gui.addFolder('Helpers');
        for (var i = 0; i < self.helpers.length; i++) {
            folder.add(self.helpers[], 'visible');
            self.gui.__folders.Helpers.__controllers[i].name(self.helpers[i].constructor.name);
        }
        */

        /*
        self.gui.add(self, 'Helpers', false, true).onChange(function(state){
            for (var i = 0; i < self.helpers.length; i++) {
                self.scene[state ? 'add' : 'remove'](self.helpers[i]);
            }
        });


        folder = self.gui.addFolder('Towers');
        folder.add(self, 'Speed').onChange(function(value){
            this.scene.traverse(function(child){
                if (child instanceof DefenseTower) {
                    child.options.fireSpeed = value;
                }
            });
        });                
        */

        callback();
    };

    /**
     * Fill map (ground, trees, towers, ...)
     * 
     * @private
     * @param  {Function} main_callback called when every elements has been added to scene
     */
    Game.prototype._fillMap = function(main_callback) {

        var self = this;

        async.series([
            _.bind( this._initSky, this),
            
            function (callback) {
                console.log('BYPASS TREES'); callback(); return;

                var loader = new THREE.OBJLoader();
                loader.load('/gamedata/maps/mountains_trees.obj', function (object) {
                    object.traverse(function (child) {
                        if (child instanceof THREE.Mesh) {
                            for (var i = 0; i < child.geometry.vertices.length && i < 200; i++) {
                                self.newTree(child.geometry.vertices[i]);
                            }
                        }
                    });

                    self.scene.add(self._treesGroup);
                    callback();
                });
            },
            
            _.bind( this._setupGui, this),

        ], main_callback);
    };

    /**
     * Attach a listener for the next selection. There can be only one listener.
     * 
     * @param  {Function} onSelection
     */
    Game.prototype.waitForSelection = function(onSelection) {

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
    Game.prototype.raycast = function( event, objects ) {

      objects = objects || this.intersectObjects;

      if (! this._raycaster_vector) {
        this._raycaster_vector = new THREE.Vector3();
      }

      var dims = this.getContainerDimensions();

      this._raycaster_vector.set(
         (event.clientX / dims.width) * 2 - 1,
        -(event.clientY / dims.height) * 2 + 1,
        this.camera.near
      );

      if (! this._projector) {
        this._projector = new THREE.Projector();
      }

      this._projector.unprojectVector(this._raycaster_vector, this.camera);

      this._raycaster = new THREE.Raycaster(this.camera.position, this._raycaster_vector.sub(this.camera.position).normalize());

      var intersects = this._raycaster.intersectObjects(objects, true); // recursive

      return intersects;
    };

    ////////////////////////////////

    Game.prototype.getContainerDimensions = function() {

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
    Game.prototype._initListeners = function() {

        this.settings.container.addEventListener('mouseup', _.bind( this._onDocumentMouseUp, this), false);
        this.settings.container.addEventListener('mousedown', _.bind( this._onDocumentMouseDown, this), false);
        this.settings.container.addEventListener('mousemove', _.bind( this._onDocumentMouseMove, this), false);
        this.settings.container.addEventListener('mousewheel', _.bind( this._onMouseScroll, this ), false );
        this.settings.container.addEventListener('DOMMouseScroll', _.bind( this._onMouseScroll, this ), false ); // firefox

        if (typeof window !== 'undefined') {
            window.addEventListener('resize', _.bind( this._onWindowResize, this), false);
        }
    };

    Game.prototype._testKey = function(value, key) {

        var test = this.settings.keys[key];

        if (_.isArray(test)) {
            return this.settings.keys[key].indexOf(event.button);

        } else if (_.isFunction(test)) {
            return this.settings.keys[key](event.button);

        } else {
            return this.settings.keys[key] == event.button;
        }
    };

    /**
     * Resize listener
     * 
     * @private
     */
    Game.prototype._onWindowResize = function() {

        var dims = this.getContainerDimensions();

        windowHalfX = dims.width / 2;
        windowHalfY = dims.height / 2;
        this.camera.aspect = windowHalfX / windowHalfY;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( dims.width, dims.height );
        this._effectsPass.effectFXAA.uniforms[ 'resolution' ].value.set( 1 / dims.width, 1 / dims.height );
    }

    Game.prototype._onMouseScroll = function(event) {

        this.settings.cameraHeight = Math.max(50, this.settings.cameraHeight - event.wheelDeltaY * .01);
    };

    /**
     * Mouse clicks listener
     * 
     * @private
     */
    Game.prototype._onDocumentMouseUp = function(event) {

        var self = this;
        //event.preventDefault();

        var intersects = self.raycast(event, self.intersectObjects);

        if (intersects.length > 0) {

            var i_pos = intersects[0].point,
                entity;

            // console.log('intersect at %o %o', i_pos.x, i_pos.y, i_pos.z );

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
            } else if (event.button === 0 && event.shiftKey && intersects[0].object.parent && Utils.childOf(intersects[0].object.parent, 'threearena/elements/terrain')) {

              PathFinding.setPolyUnwalkable(
                i_pos.x, i_pos.y, i_pos.z,
                5, 5, 5,
                0
              );

            } else if (self._testKey(event.button, 'MOVE_BUTTON') && intersects[0].object.parent && Utils.childOf(intersects[0].object.parent, 'threearena/elements/terrain')) {

              self.endAllInteractions();

              self.destinationMarker.position.copy(i_pos);
              self.destinationMarker.animate();

              if (character) {
                console.log('find a path between %o and %o', character.position, i_pos);

                // character.objective = { position: i_pos };
                // character.behaviour = character.behaviour.warp('plotCourseToObjective');

                var startPosition = character.position.clone();

                /*
                if (character._currentTween && character._currentTweenDestination && true) {
                    startPosition.copy(character._currentTweenDestination);
                }
                character._currentTweenDestination = i_pos.clone();
                */

                PathFinding.findPath(
                    startPosition.x, startPosition.y, startPosition.z,
                    i_pos.x, i_pos.y, i_pos.z,
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

              // __add_tree(i_pos);

              // user clicked something
              if (intersects[0].object && intersects[0].object) {

                  // maybe an entity ?
                  entity = Utils.childOf(intersects[0].object, 'threearena/entity');

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
                  } else if (intersects[0].object.parent && intersects[0].object.parent.parent 
                      && intersects[0].object.parent.parent instanceof InteractiveObject) {

                      if (intersects[0].object.parent.parent.isNearEnough(character)) {
                          self.startInteraction(intersects[0].object.parent.parent);

                      } else {
                          console.log("C'est trop loin !");
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
    Game.prototype._onDocumentMouseDown = function(event) {

      var self = this;
      //event.preventDefault();

      // for now, just discard during a click-selection 
      if (self._waitForSelection) return;

      // intersect everything ... only the ground
      var intersects = self.raycast(event, self.intersectObjects);

      // .. but check if the ground if the first intersection
      // TODO: find another way to check ==ground
      if (intersects.length > 0 && self._testKey(event.button, 'BEGIN_SELECTION') && Utils.childOf(intersects[0].object.parent, 'threearena/elements/terrain')) {
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
     * @param  {Event} event
     */
    Game.prototype._onDocumentMouseMove = function(event) {

      if (this._inGroundSelection) {
        // in a selection
        var p1 = this._inGroundSelection.screen,
            p2 = { x: event.clientX, y: event.clientY },
            pos_left = p1.x > p2.x ? p2.x : p1.x,
            pos_top = p1.y > p2.y ? p2.y : p1.y,
            sel_width = Math.abs(p1.x - p2.x),
            sel_height = Math.abs(p1.y - p2.y);

        if (sel_height > 2 && sel_width > 2) {
            $('#selection-rectangle').css({
              height: sel_height,
              width: sel_width,
              left: pos_left,
              top: pos_top
            }).show();
        }
      }

    };

    /////////////////////////////////////////
    // TERRAIN

    /**
     * Set the walkable terrain
     * 
     * @param {string} file Path to the OBJ file
     * @param {object} options Options
     * @param {object} options.wireframe Set the terrain material as wireframe
     * 
     * @example
     // Set this .OBJ file as the walkable terrain
     game.setTerrain('/path/to/walkable.obj', {
        wireframe: true,
        tDiffuse: '/path/to/color_texture.jpg',
        tNormal: '/path/to/normal_map.jpg'
     });
     */
    Game.prototype.setTerrain = function(file, options) {
        var self = this;

        options = _.merge({

            cellSize: 2,            // nav mesh cell size (.8 > 2)
            cellHeight: 1.5,        // nav mesh cell height (.5 > 1)
            agentHeight: 2.0,       // character height (1.2 => 2)
            agentRadius: 0.5,       // character radius (.5 > 2)
            agentMaxClimb: 4.0,     // max units character can jump (1 > 5)
            agentMaxSlope: 30.0     // max degre character can climb (20 > 40)

        }, options, {
            onLoad: function(terrain) {
                self.ground = terrain;
                self.intersectObjects = self.intersectObjects.concat(self.ground.children[0].children);
                self.scene.add(self.ground);

                self.ground.traverse( function ( child ) {
                    if ( child instanceof THREE.Mesh ) {
                        child.receiveShadow = true;

                        child.geometry.boundingBox || child.geometry.computeBoundingBox();
                        self.groundBbox = child.geometry.boundingBox;
                    }
                } );


                // load the navigation mesh
                $.ajax({
                  url: file,
                  success: function(data) {
                    Config = {};

                    PathFinding.set_cellSize(options.cellSize);
                    PathFinding.set_cellHeight(options.cellHeight);

                    PathFinding.set_agentHeight(options.agentHeight);
                    PathFinding.set_agentRadius(options.agentRadius);

                    PathFinding.set_agentMaxClimb(options.agentMaxClimb);
                    PathFinding.set_agentMaxSlope(options.agentMaxSlope);

                    PathFinding.initWithFileContent(data);
                    PathFinding.build();

                    self.trigger('set:terrain', self.ground);
                  }
                })
            }
        });

        new Terrain(file, options);

        return this;
    };

    Game.prototype.computeNavigationMesh = function(callback) {

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
                        opacity: .8
                    });
                    self.scene.add(self.navigationMesh);
                    callback && callback(null, self.navigationMesh);
                })
            );
        } else {
            callback && callback(null, self.navigationMesh);
        }
    };

    Game.prototype.groundObject = function(object) {

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

    Game.prototype.randomPositionOnterrain = function(callback) {

        PathFinding.getRandomPoint(Utils.gcb(callback));
    };

    Game.prototype.addObstacle = function(position, radius, flag) {
        
        if (this.settings.showObstacles) {
            var obsctacle = new THREE.Mesh( new THREE.PlaneGeometry(radius, radius, radius, 1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xff0000 }) );
            obsctacle.position.copy(position);
            obsctacle.rotation.x = 90 * Math.PI / 180;
            this.scene.add(obsctacle);
        }

        PathFinding.setPolyUnwalkable(position.x, position.y, position.z, radius, radius, radius, 0);
    };


    /**
     * Setup an entity before it get added in the scene
     * 
     * @param  {Entity} entity The entity to be setup
     */
    Game.prototype._prepareEntity = function(entity) {

        var self = this;

        // entities should have a lifebar
        entity.attachLifeBar();

        // casts shadows
        entity.traverse(function (child) {
            if (child instanceof THREE.Mesh && child.parent && ! child.parent instanceof LifeBar) {
                child.castShadow = true;
            }
        });

        // has a collision box
        var invisibleMaterial = new THREE.MeshBasicMaterial({ wireframe: true, color: 0xffffff, transparent: true, opacity: 0.5 });
        var box = new THREE.Box3();
        box.setFromObject(entity);
        box = new THREE.Mesh(new THREE.CubeGeometry(
            box.max.x - box.min.x,
            box.max.y - box.min.y + ((box.max.y - box.min.y) * .20), // a bit higher to include head
            box.max.z - box.min.z
            , 1, 1, 1
        ), invisibleMaterial);
        box.visible = self.settings.visibleCharactersBBox;
        entity.add(box);

        // is intersectable
        self.intersectObjects.push(box);

        // add its lifebar as a scene child ..
        self.scene2.add(entity.lifebar);
        // .. that always face camera
        self.bind('update', function(game){
            entity.lifebar.update(game.delta);
            entity.lifebar.position.copy(entity.position);
            entity.lifebar.position.y += 10;
            // entity.lifebar.lookAt( self.camera.position );
            entity.lifebar.rotation.y = self.camera.rotation.y;
        });
        // .. and disappear whenever the character die
        entity.bind('death', function(){
            entity.lifebar.parent.remove(entity.lifebar);
        });

        self.trigger('added:entity', entity);
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
    Game.prototype.addStatic = function(builder) {

        var self = this;

        builder(function(object) {

            // Attach a life/mana bar above the entity
            if (object instanceof Entity) {
                self._prepareEntity(object);
            }

            if (object.isBlocking) {
                self.addObstacle(object.position, 4);
            }

            self.scene.add(object);

            self.trigger('added:static', object);
        });

        return this;
    };

    /////////////////////////////////////////
    // INTERACTIVES

    /**
     * Add an interactive object
     * 
     * @param {InteractiveObject} object Interactive Object
     * @param {object} options Options
     * 
     * @fires module:threearena/game#added:interactive
     * 
     * @@return {this} The game object
     */
    Game.prototype.addInteractive = function(object, options) {
        this.intersectObjects.push(object);
        this.scene.add(object);

        return this;
    };

    /**
     * End all not-near-enough interaction
     * 
     * @@return {this} The game object
     */
    Game.prototype.endAllInteractions = function () {

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
    Game.prototype.startInteraction = function (interactiveObject) {

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
    Game.prototype.addCharacter = function(builder) {

        var self = this;

        var add = function(character){

            // characters are always grounded
            if (self.ground) {
                self.groundObject(character);
            }

            // Attach a life/mana bar above the entity
            self._prepareEntity(character);

            self.pcs.push(character);
            self.scene.add(character);
        }

        if (_.isFunction(builder)) {
            builder(add);
        } else {
            add(builder);
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
    Game.prototype.removeCharacter = function(character) {

        this.pcs = _.without(this.pcs, character);
        this.scene.remove(character);

        return this;
    };

    Game.prototype.asPlayer = function(entity) {

        this.hud.attachEntity(entity);
        // entity.add(this.pointLight);
        this.camera.position.set( entity.position.x + 30, 50, entity.position.z + 40 );
    };

    /**
     * Current selected objects
     *
     * @private
     * @type {Array}
     */
    Game.prototype._selected_objects = [ ];

    /**
     * Deselect all selected characters
     * 
     * @param  {Array} butCharacters These characters should not be deselected
     * 
     * @@return {this} The game object
     *
     * @fires module:threearena/game#unselect:all
     */
    Game.prototype.unselectCharacters = function (butCharacters) {

      if (! _.isArray(butCharacters)) butCharacters = [ butCharacters ];

      var self = this,
          unselected = [];

      for (var i = 0; i < this._selected_objects.length; i++) {
        if (this._selected_objects[i]._marker) {
            this._selected_objects[i].remove(this._selected_objects[i]._marker);
        }
      }
      
      this._selected_objects.length = 0;
      self._waitForSelection = null;
      this._inGroundSelection = null;
      $('#selection-rectangle').hide();

      self.trigger('unselect:all', unselected);

      return this;
    };

    /**
     * Select all characters in a zone and return them.
     * 
     * @param  {Vector3} start Top left point of the select area
     * @param  {Vector3} end Bottom right point of the select area
     * 
     * @return {Array} Array of selected characters
     * 
     * @fires module:threearena/game#select:entities
     */
    Game.prototype.selectCharactersInZone = function (start, end) {

      var self = this;

      var selected = _.filter(this.pcs, function(character) {
        var itsin = ! character.isDead() 
            && character.position.x > start.x && character.position.z > start.z 
            && character.position.x < end.x && character.position.z < end.z;

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

      self.trigger('select:entities', selected);

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
    Game.prototype.addSpawningPool = function(pool) {
        var self = this;

        this.scene.add(pool);
        pool.bind('spawnedone', function(character){
            character.position.copy(pool.position);
            self.addCharacter(character);
        });

        self.trigger('added:spawningpool', pool);

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
    Game.prototype.start = function() {

        this._initListeners();

        this.hud.open();

        this.trigger('start');

        if (this.settings.splashContainer) {
            this.settings.splashContainer.className += ' animated fadeOutUpBig';
        }
        this.settings.container.style.className += ' animated fadeInUpBig';
        this.settings.container.style.display = 'block';

        this._started = true;

        this._boundAnimate = _.bind( this.animate, this );
        this.animate();

        // timers
        this._behaviours_delta = this.clock.getDelta();

        return this;
    };

    /**
     * The render loop
     */
    Game.prototype.animate = function() {

        requestAnimationFrame( this._boundAnimate );
        this.render();
    };

    /**
     * Where things are rendered, inside the render loop
     * 
     * @fires module:threearena/game#update
     * @fires module:threearena/game#update:behaviours
     */
    Game.prototype.render = function() {

        var self = this;

        this.delta = this.clock.getDelta() * this.settings.speed;

        if (this.clock.oldTime - this._behaviours_delta > 100) {
            this._behaviours_delta = this.clock.oldTime;
            this.trigger('update:behaviours', this);
        }

        window._ta_events.trigger('update', this);

        this.trigger('update', this);

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
    Game.prototype.find = function(name) {
        return this.scene.getObjectByName(name);
    };

    /**
     * Finds all game objects tagged tag.
     *
     * @param tag tag name
     */
    Game.prototype.findAllWithTag = function(tag) {
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
    Game.prototype.findWithTag = function(tag) {
        var found = findAllWithTag(tag);
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

    /////////////////////////////////////////

    Entity.prototype.constructor = Entity;
    return Game;
});