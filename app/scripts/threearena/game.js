define('threearena/game',
    ['lodash', 'async', 'threejs', 'tweenjs', 'zepto',

    'threearena/utils',
    'threearena/hud',
    'threearena/hud/spelltexts',
    'threearena/entity',
    'threearena/elements/terrain',
    'threearena/elements/nexus',
    'threearena/elements/lifebar',
    'threearena/elements/aboveheadmark',
    'threearena/elements/interactiveobject', 
    'threearena/particles/cloud', 
    'threearena/controls/dota',
    'threearena/controls/destinationmarker',
    'threearena/pathfinding/recast.emcc.oem',
    
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

    /**
     * The main game class
     * 
     * @constructor
     * @exports threearena/game
     * @param {Object} settings
     * @triggers 'before:init', 'before:fillmap', 'ready', 'update'
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

            container: null,

            positions: {
                origin: new THREE.Vector3( 0, 0, 0 )
            },

        }, settings);

        //////////

        MicroEvent.mixin(this);

        this._treesRefs  = [];

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

            // depends on character position
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
     * @param  {Function} callback called when ready to run
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
     */
    Game.prototype._initCamera = function() {

        this.camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 10000 );
    };

    /**
     * Init scene
     */
    Game.prototype._initScene = function() {

        this.scene = new THREE.Scene();
        //this.scene.fog = new THREE.FogExp2( 0x0, 0.00055 );
        this.scene.fog = new THREE.Fog( this.settings.fog.color, this.settings.fog.near, this.settings.fog.far );

        this.scene.add(this.destinationMarker);
    };

    /**
     * Init global game lights
     */
    Game.prototype._initLights = function() {

        this.ambientLight = new THREE.AmbientLight( 0xffffff );
        this.scene.add( this.ambientLight );

        this.pointLight = new THREE.PointLight( 0xffffff, 1.25, 1000 );
        //this.pointLight.shadowCameraVisible = true;
        this.pointLight.position.set( 0, 0, 600 );
        this.scene.add( this.pointLight );

        this.directionalLight = new THREE.SpotLight( 0xffffff );
        // this.directionalLight.ambient = 0xffffff;
        // this.directionalLight.diffuse = 0xffffff;
        this.directionalLight.specular = new THREE.Color('#050101'); // 0xaaaa22;
        this.directionalLight.position.set( -200, 400, -200 );
        this.directionalLight.intensity = .9;
        this.directionalLight.castShadow = true;
        this.directionalLight.shadowMapWidth = 1024;
        this.directionalLight.shadowMapHeight = 1024;
        this.directionalLight.shadowMapDarkness = 0.95;
        this.directionalLight.shadowCameraVisible = true;
        this.scene.add( this.directionalLight );
    };

    /**
     * Init the renderer
     */
    Game.prototype._initRenderer = function() {
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
        // this.renderer.shadowMapWidth = window.innerWidth;
        // this.renderer.shadowMapHeight = window.innerHeight;

        this.renderer.setClearColor( this.scene.fog.color, 1 );

        this.renderer.setSize( window.innerWidth, window.innerHeight);

        var renderModel = new THREE.RenderPass( this.scene, this.camera ); renderModel._name = 'Model';
        var effectBleach = new THREE.ShaderPass( THREE.BleachBypassShader ); effectBleach._name = 'Bleach';
        var effectColor = new THREE.ShaderPass( THREE.ColorCorrectionShader ); effectColor._name = 'Color';
        var effectFXAA = new THREE.ShaderPass( THREE.FXAAShader ); effectFXAA._name = 'FXAA';

        effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
        effectBleach.uniforms[ 'opacity' ].value = 0.2;
        effectColor.uniforms[ 'powRGB' ].value.set( 1.4, 1.45, 1.45 );
        effectColor.uniforms[ 'mulRGB' ].value.set( 1.1, 1.1, 1.1 );
        effectFXAA.renderToScreen = true;

        this.composer = new THREE.EffectComposer( this.renderer );
        this.composer.addPass( renderModel );
        this.composer.addPass( effectBleach );
        this.composer.addPass( effectColor );
        this.composer.addPass( effectFXAA );

        this.settings.container.appendChild( this.renderer.domElement );

        // CONTROLS

        //this.cameraControls = new THREE.TrackballControls( this.camera, this.renderer.domElement );
        this.cameraControls = new CameraControls( this.camera, this.renderer.domElement );
        this.cameraControls.domElement = this.renderer.domElement;
    };


    Game.prototype._clampCameraToGround = function() {
        var bbox;

        this.ground.traverse( function ( child ) {
            if ( child instanceof THREE.Mesh ) {
                child.receiveShadow = true;

                child.geometry.boundingBox || child.geometry.computeBoundingBox();
                bbox = child.geometry.boundingBox;
            }
        } );

        this.cameraControls.clamp = {
            xmin: bbox.min.x * .9, //  -90,
            xmax: bbox.max.x * .9, //   90,
            zmin: bbox.min.z * .9 + 30, //  -30,
            zmax: bbox.max.z * .9 + 50, //  170,
        };
    };


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
            depthWrite: false,
            side: THREE.BackSide
        });

        // build the skybox Mesh 
        var skyboxMesh = new THREE.Mesh( new THREE.CubeGeometry( 600, 600, 600, 1, 1, 1, null, true ), material );
        skyboxMesh.renderDepth = 1e20;
        this.scene.add( skyboxMesh );
        done();
    };

    /**
     * Setup the basic options GUI
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
        folder.addColor(self.directionalLight, 'color');

        folder = self.gui.addFolder('Fog');
        folder.add(self.scene.fog, 'near');
        folder.add(self.scene.fog, 'far');

        folder = self.gui.addFolder('Controls');
        folder.add(self.cameraControls, 'mouseEnabled');
        folder.add(self.helpers, 'visible');

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
     * Attach a listener for the next selection
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
     * @return {Object} An intersections object
     */
    Game.prototype.raycast = function( event, objects ) {

      objects = objects || this.intersectObjects;

      if (! this._raycaster_vector) {
        this._raycaster_vector = new THREE.Vector3();
      }

      this._raycaster_vector.set(
         (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1,
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

    /**
     * Set listeners to play the game in the browser
     */
    Game.prototype._initListeners = function() {

        this.settings.container.addEventListener('mouseup', _.bind( this.onDocumentMouseUp, this), false);
        this.settings.container.addEventListener('mousedown', _.bind( this.onDocumentMouseDown, this), false);
        this.settings.container.addEventListener('mousemove', _.bind( this.onDocumentMouseMove, this), false);
        this.settings.container.addEventListener('resize', _.bind( this.onWindowResize, this), false);
    };

    /**
     * Resize listener
     */
    Game.prototype.onWindowResize = function() {

        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
    }

    /**
     * Mouse clicks listener
     */
    Game.prototype.onDocumentMouseUp = function(event) {

        var self = this;
        //event.preventDefault();

        var intersects = self.raycast(event, self.intersectObjects);

        if (intersects.length > 0) {

            var i_pos = intersects[0].point,
                entity;

            // console.log('intersect at %o %o', i_pos.x, i_pos.y, i_pos.z );

            // place helper
            // helper.position.set(0, 0, 0);
            // helper.lookAt(intersects[0].face.normal);
            // helper.position.copy(i_pos);

            var character = self.pcs[0];

            if (self._inGroundSelection) {

              // ends a ground selection
              var selection = {
                begins: self._inGroundSelection.ground,
                ends: intersects[0].point
              };

              self._inGroundSelection = null;
              $('#selection-rectangle').hide();

              self.unselectCharacters();
              self.selectCharactersInZone(selection.begins, selection.ends);

            // TODO: find another way to check ==ground
            } else if (event.button == 2 && Utils.childOf(intersects[0].object.parent, 'threearena/elements/terrain')) {

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
              

                  } else if (0) {

                      // SUPER SIMPLE GLOW EFFECT
                      // use sprite because it appears the same from all angles
                      var spriteMaterial = new THREE.SpriteMaterial({ 
                          map: new THREE.ImageUtils.loadTexture('/gamedata/textures/glow.png'), 
                          useScreenCoordinates: false,
                          alignment: THREE.SpriteAlignment.center,
                          color: 0x0000ff,
                          transparent: false,
                          blending: THREE.AdditiveBlending
                      });
                      var sprite = new THREE.Sprite( spriteMaterial );
                      sprite.scale.set(10, 10, 10);
                      intersects[0].object.parent.parent.add(sprite); // this centers the glow at the mesh                        
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
     * @param  {Event} event
     */
    Game.prototype.onDocumentMouseDown = function(event) {

      var self = this;
      //event.preventDefault();

      // for now, just discard during a click-selection 
      if (self._waitForSelection) return;

      // intersect everything ... only the ground
      var intersects = self.raycast(event, self.intersectObjects);

      // .. but check if the ground if the first intersection
      // TODO: find another way to check ==ground
      if (intersects.length > 0 && event.button === 0 && Utils.childOf(intersects[0].object.parent, 'threearena/elements/terrain')) {
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
     * @param  {Event} event
     */
    Game.prototype.onDocumentMouseMove = function(event) {

      if (this._inGroundSelection) {
        // in a selection
        // draw a rectangle
        // TODO: handle reverse (x & y) selection
        var p1 = this._inGroundSelection.screen,
            p2 = { x: event.clientX, y: event.clientY };

        $('#selection-rectangle').css({
          left: p1.x > p2.x ? p2.x : p1.x,
          top: p1.y > p2.y ? p2.y : p1.y,
          width: Math.abs(p1.x - p2.x),
          height: Math.abs(p1.y - p2.y)
        }).show();
      }

    };

    /////////////////////////////////////////
    // TERRAIN

    /**
     * Set the walkable terrain
     * 
     * @param {String} terrain Path to the OBJ file
     * @param {Object} options Options
     */
    Game.prototype.setTerrain = function(file, options) {
        var self = this;

        options = options || {};

        new Terrain(file, _.merge(options, {
            onLoad: function(terrain) {
                self.ground = terrain;
                self.intersectObjects = self.intersectObjects.concat(self.ground.children[0].children);
                self.scene.add(self.ground);

                // load the navigation mesh
                $.ajax({
                  url: file,
                  success: function(data) {
                    Config = {};
                    PathFinding.set_cellSize(.8);
                    PathFinding.set_cellHeight(.5);
                    PathFinding.initWithFileContent(data);
                    PathFinding.build();
                    self.trigger('set:terrain', self.ground);
                  }
                });
            }
        }));

        return this;
    };

    Game.prototype.groundObject = function(object) {

        var self = this;

        if (self.ground) {
            // double-check the elevation, objects cannot be under ground
            var inifiniteElevation = object.position.clone().setY(10000000);
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
     * Add a static object
     * 
     * @param {String} terrain Path to the OBJ file
     * @param {Object} options Options
     */
    Game.prototype.addStatic = function(builder) {

        var self = this;

        builder(function(object){
            self.scene.add(object);
            self.trigger('added:static', self.ground);
        });

        return this;
    };

    /////////////////////////////////////////
    // INTERACTIVES

    /**
     * Add an interactive object
     * 
     * @param {InteractiveObject} object Interactive Object
     * @param {Object} options Options
     */
    Game.prototype.addInteractive = function(object, options) {
        this.intersectObjects.push(object);
        this.scene.add(object);

        return this;
    };

    /**
     * End all not-near-enough interaction
     * 
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
     * @param {Entity} character
     * @param {THREE.Vector3} spawnPosition (map's spawn point by default)
     */
    Game.prototype._addCharacter = function(character) {
        var self = this;

        // var spawnPosition = spawnPosition || this.settings.positions.spawn || new THREE.Vector3();
        // character.position.set(spawnPosition.x, spawnPosition.y, spawnPosition.z);

        if (self.ground) {
            self.groundObject(character);
        }

        // the first one, the main one
        if (self.pcs.length === 0) {
            self.hud.attachEntity(character);
            self.camera.position.set( character.position.x + 30, 50, character.position.z + 40 );
        }

        character.traverse(function (child) {
            if (child instanceof THREE.Mesh && child.parent && ! child.parent instanceof LifeBar) {
                // FIXME: Some meshes cannot be used directly for collision (SkinnedMesh)
                // IDEA: Compute the whole character's bbox in the Character class, skipping weapons, tails, etc..
                // self.intersectObjects.push(child);

                child.castShadow = true;
            }
        });

        // Colisions box, mainly because MD2 can't be collided (morphTargets)
        var invisibleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0 });
        var box = new THREE.Box3();
        box.setFromObject(character);
        box = new THREE.Mesh(new THREE.CubeGeometry(box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z, 1, 1, 1));
        box.visible = false;
        character.add(box);

        self.intersectObjects.push(box);

        self.pcs.push(character);
        self.scene.add(character);
        self.trigger('added:entity', character);
    };

    /**
     * Add a character. The first one is the main one
     * 
     * @param {Entity} character
     * @param {THREE.Vector3} spawnPosition (map's spawn point by default)
     */
    Game.prototype.addCharacter = function(builder) {

        var self = this;

        builder(function(character){
            self._addCharacter(character);
        });

        return this;
    };

    /**
     * Remove a character from the scene
     * 
     * @param  {Entity} character
     */
    Game.prototype.removeCharacter = function(character) {

        this.pcs = _.without(this.pcs, character);
        this.scene.remove(character);

        return this;
    };

    /**
     * Current selected objects
     * 
     * @type {Array}
     */
    Game.prototype._selected_objects = [ ];

    /**
     * Deselect all selected characters
     * 
     * @param  {Array} butCharacters These characters should not be deselected
     */
    Game.prototype.unselectCharacters = function (butCharacters) {

      if (! _.isArray(butCharacters)) butCharacters = [ butCharacters ];

      for (var i = 0; i < this._selected_objects.length; i++) {
        if (this._selected_objects[i]._marker) {
            this._selected_objects[i].remove(this._selected_objects[i]._marker);
        }
      }
      
      this._selected_objects.length = 0;
      self._waitForSelection = null;
      this._inGroundSelection = null;
      $('#selection-rectangle').hide();

      return this;
    };

    /**
     * Select all characters in a zone and return them.
     * 
     * @param  {Vector3} start Top left point of the select area
     * @param  {Vector3} end Bottom right point of the select area
     * @return {Array} Array of selected characters
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

      return selected;
    };


    /////////////////////////////////////////
    // SPAWNING POOLS

    /**
     * Add a spawning pool
     * 
     * @param {SpawningPool} pool spawning pool
     */
    Game.prototype.addSpawningPool = function(pool) {
        var self = this;

        this.scene.add(pool);
        pool.bind('spawnedone', function(character){
            character.position.copy(pool.position);
            self._addCharacter(character);
        });

        return this;
    };


    /////////////////////////////////////////
    // GAME FLOW

    /**
     * Start a new game
     *
     * @trigger 'start'
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
     * @trigger 'update'
     */
    Game.prototype.render = function() {

        var self = this;

        this.delta = this.clock.getDelta();

        if (this.clock.oldTime - this._behaviours_delta > 300) {
            this._behaviours_delta = this.clock.oldTime;
            this.trigger('update:behaviours', this);
        }

        window._ta_events.trigger('update', this);

        this.trigger('update', this);

        this.cameraControls.update(this.delta);
        this.camera.position.y = 80; // crraaaapp //

        _.each(this.pcs, function(character){
            character.update(self);
        });

        this.stats.update()
        TWEEN.update();

        this.composer.render();
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

    Entity.prototype.constructor = Entity;
    return Game;
});