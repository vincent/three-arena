/**
 * @module Game
 */
define('threearena/game',
    ['lodash', 'async', 'threejs', 'tweenjs',

    'threearena/utils',
    'threearena/hud',
    'threearena/elements/tower',
    'threearena/elements/lifebar',
    'threearena/elements/interactiveobject', 
    'threearena/particles/cloud', 
    'threearena/controls/dota',
    'threearena/pathfinding/recast.emcc.dota.mountains',
    
    'MD2Character',
    'MD2CharacterComplex',
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

], function (_, async, THREE, TWEEN,
 
    Utils,
    HUD,
    DefenseTower,
    LifeBar,
    InteractiveObject,
    Particles,
    CameraControls,
    PathFinding
 
) {
    PathFinding = Module;

    /**
     * The main game class
     * 
     * @param {Object} settings
     * @triggers 'before:init', 'before:fillmap', 'ready', 'update'
     */
    var Game = function (settings) {

        this.settings = _.defaults(settings, {

            preload: [],

            container: null,

            positions: {
                origin: new THREE.Vector3( 0, 0, 0 )
            },

            debugAxis: false,

        }, settings);
    };

    /**
     * Init the pathfinding subsystem, and load its settings.preload urls with RequireJS  
     * @param  {Function} callback, called when finished
     */
    Game.prototype.preload = function(done) {

        Config = {};
        PathFinding.set_cellSize(.8);
        PathFinding.set_cellHeight(.4);
        PathFinding.initWithFile('/gamedata/maps/mountains.obj');
        PathFinding.build();
        require(this.settings.preload, done);
    };

    /**
     * Init the game, reset characters and map elements
     * @param  {Function} callback, called when ready to run
     */
    Game.prototype.init = function( ready ) {

        var self = this;

        this.settings.container.innerHTML = '';

        this.trigger('before:init');

        //////////

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

        this.pcs = [];
        this.intersectObjects = [];

        this.hud = new HUD.GameHud('hud-container');

        //////////

        this._initCamera();

        this._initScene();

        this._initLights();

        this.clock = new THREE.Clock();

        // AXIS HELPER
        if (this.settings.debugAxis) {
            this.axisHelper = new THREE.AxisHelper( 1000 );
            this.axisHelper.position.set(0, 0, 0);
            this.scene.add(this.axisHelper);
        }

        // INTERSECTIONS HELPER
        // var geometry = new THREE.CylinderGeometry( 0, 1, 1, 3 );
        // geometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 0, 0 ) );
        // geometry.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );
        // helper = new THREE.Mesh( geometry, new THREE.MeshNormalMaterial() );
        // this.scene.add(helper);

        this._initRenderer();

        this.trigger('before:fillmap');

        this._fillMap(function() {

            self.hud.attachGame(self);

            self.trigger('ready', self);

            ready();
        });
    };

    /**
     * Init the game camera
     */
    Game.prototype._initCamera = function() {

        this.camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 10000 );
        this.camera.position.set( this.settings.positions.spawn.x + 30, 50, this.settings.positions.spawn.z + 40 );
    };

    /**
     * Init scene
     */
    Game.prototype._initScene = function() {

        this.scene = new THREE.Scene();
        //this.scene.fog = new THREE.FogExp2( 0x0, 0.00055 );
        this.scene.fog = new THREE.Fog( 0x444444, 100, 300 );
    };

    /**
     * Init global game lights
     */
    Game.prototype._initLights = function() {

        this.ambientLight = new THREE.AmbientLight( 0x888888 );
        this.scene.add( this.ambientLight );

        this.pointLight = new THREE.PointLight( 0xffffff, 1.25, 1000 );
        //this.pointLight.shadowCameraVisible = true;
        this.pointLight.position.set( 0, 0, 600 );
        this.scene.add( this.pointLight );

        this.directionalLight = new THREE.SpotLight( 0xffffff );
        // this.directionalLight.ambient = 0xffffff;
        // this.directionalLight.diffuse = 0xffffff;
        // this.directionalLight.specular = 0xffffff;
        this.directionalLight.position.set( -200, 400, -200 );
        this.directionalLight.intensity = 1;
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

        this.renderer.setSize( window.innerWidth, window.innerHeight );

        var renderModel = new THREE.RenderPass( this.scene, this.camera );
        var effectBleach = new THREE.ShaderPass( THREE.BleachBypassShader );
        var effectColor = new THREE.ShaderPass( THREE.ColorCorrectionShader );
        var effectFXAA = new THREE.ShaderPass( THREE.FXAAShader );

        effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
        effectBleach.uniforms[ 'opacity' ].value = 0.2;
        effectColor.uniforms[ 'powRGB' ].value.set( 1.4, 1.45, 1.45 );
        effectColor.uniforms[ 'mulRGB' ].value.set( 1.1, 1.1, 1.1 );
        effectFXAA.renderToScreen = true;

        this.composer = new THREE.EffectComposer( this.renderer );
        this.composer.addPass( renderModel );
        //this.composer.addPass( effectBleach );
        //this.composer.addPass( effectColor );
        this.composer.addPass( effectFXAA );

        this.settings.container.appendChild( this.renderer.domElement );

        // CONTROLS

        //this.cameraControls = new THREE.TrackballControls( this.camera, this.renderer.domElement );
        this.cameraControls = new CameraControls( this.camera, this.renderer.domElement );
        this.cameraControls.domElement = this.renderer.domElement;
    };

    Game.prototype._initObjectives = function(done) {
        var mesh;

        this.objectives[0] = new THREE.Mesh( new THREE.CubeGeometry(10, 20, 10, 1, 1, 1) , new THREE.MeshBasicMaterial({ color:'#e33' }));
        this.objectives[0].position.set(-179.6, 13.8, 180.7);
        this.scene.add(this.objectives[0]);

        this.objectives[1] = new THREE.Mesh( new THREE.CubeGeometry(10, 20, 10, 1, 1, 1) , new THREE.MeshBasicMaterial({ color:'#33e' }));
        this.objectives[1].position.set(169.5, 17.8, -130.4);
        this.scene.add(this.objectives[1]);

        done();
    };

    /**
     * Init the ground mesh. Supposed to be overidden in actual game classes 
     * @param  {Function} callback, called when ground mesh is set
     */
    Game.prototype._initGround = function(done) {
        var groundGeometry = new THREE.PlaneGeometry(500, 500, 1, 1);
        var groundMaterial = new THREE.MeshBasicMaterial({ color:'#ddd' });

        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.receiveShadow = true;

        this.intersectObjects.push(this.ground);
        done();
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
        //skyboxMesh.renderDepth = 1e20;
        this.scene.add( skyboxMesh );
        done();
    };

    /**
     * Init some trees meshes, to be duplicated later
     * @param  {Function} main_callback, called when every trees models have been set
     */
    Game.prototype._initTrees = function(main_callback) {
        var self = this;

        var _load_tree_shader = function(callback){
            var uniforms;
            var shader = THREE.ShaderLib[ "normalmap" ];
            var uniforms = THREE.UniformsUtils.clone( shader.uniforms );

            uniforms[ "tNormal" ].value = THREE.ImageUtils.loadTexture( "/gamedata/pine-n.png" );
            uniforms[ "tDiffuse" ].value = THREE.ImageUtils.loadTexture( "/gamedata/pine-a.png" );
            uniforms[ "tSpecular" ].value = THREE.ImageUtils.loadTexture( "/gamedata/pine-c.png" );
            uniforms[ "enableAO" ].value = false;
            uniforms[ "enableDiffuse" ].value = true;
            uniforms[ "enableSpecular" ].value = false;
            uniforms[ "uDiffuseColor" ].value.setHex( new THREE.Color(0x55ff55) );
            uniforms[ "uSpecularColor" ].value.setHex( new THREE.Color(0x55ff55) );
            uniforms[ "uAmbientColor" ].value.setHex( new THREE.Color(0x55ff55) );
            uniforms[ "uNormalScale" ].value.set( 1, 1 );
            uniforms[ "uShininess" ].value = 10;
            var parameters = { fragmentShader: shader.fragmentShader, vertexShader: shader.vertexShader, uniforms: uniforms, lights: true, fog: true };
            self._tree_shader = new THREE.ShaderMaterial( parameters );     

            // self._tree_shader = new THREE.MeshPhongMaterial({ color:'#5f5' });
            
            callback();       
        };

        var loader = new THREE.ColladaLoader();

        var _load_tree_pine = function(callback){
            loader.load( '/gamedata/tree_pine_simplified.dae', function ( object ) {
                object = object.scene.children[3];

                object.scale.set(10, 10, 10);

                /*
                object.geometry.computeVertexNormals();
                object.geometry.computeTangents();
                */
                object.material.materials[0].transparent = true;
                object.material.materials[1].transparent = true;
               
                self._treesRefs.push(object);
                callback();
            });
        };

        var _load_tree_oak = function(callback){
            loader.load( '/gamedata/tree_oak.dae', function ( object ) {
                object = object.scene.children[0];

                object.material.materials[0].transparent = true;
                object.material.materials[1].transparent = true;

                object.material.materials[0].ambient.set(.5, 1, .5);
                object.material.materials[0].specular.set(.1, .1, .1);

                self._treesRefs.push(object);
                callback();
            });
        };

        var _load_tree_cartoon = function(callback){
            loader.load( '/gamedata/models/forest_tree.dae', function ( object ) {
                object = object.scene.children[0];

                object.position.setY(2);
                object.scale.set(2, 2, 2);

                object.material.materials[0].transparent = true;
                object.material.materials[1].transparent = true;
                object.material.materials[2].transparent = true;
                object.material.materials[3].transparent = true;

                object.material.materials[0].ambient.set(1, 1, 1);
                object.material.materials[1].ambient.set(1, 1, 1);
                object.material.materials[2].ambient.set(1, 1, 1);
                object.material.materials[3].ambient.set(1, 1, 1);

                self._treesRefs.push(object);
                callback();
            });
        };

        var _load_dracena = function(callback){
            loader.load( '/gamedata/models/plants/Dracena.dae', function ( object ) {
                object = object.scene.children[0];

                // object.scene.children[0].position.setY(2);
                object.scale.set(.2, .2, .2);
                //cartoonTree.add(object);

                object.material.materials[0].transparent = true;
                object.material.materials[1].transparent = true;
                object.material.materials[2].transparent = true;

                object.material.materials[0].ambient.set(1, 1, 1);
                object.material.materials[1].ambient.set(1, 1, 1);
                object.material.materials[2].ambient.set(1, 1, 1);

                self._treesRefs.push(object);
                callback();
            });
        };

        var _load_eatsheep = function(callback){
            loader = new THREE.OBJMTLLoader();
            loader.addEventListener('load', function (event) {
                var object = event.content.children[0].children[0];
                object.rotation.x = 90 * Math.PI / 2;
                self._treesRefs.push(object);
                callback();
            });
            loader.load('/gamedata/models/plants/eatsheep_farm_tree.obj', '/gamedata/models/plants/eatsheep_farm_tree.mtl');
        };

        async.series([
            _load_tree_shader,

            _load_tree_pine,
            // _load_tree_oak,
            // _load_tree_cartoon,
            // _load_dracena
            // _load_eatsheep
        ], main_callback);
    };

    /**
     * Instance a new tree, by duplicating a Geometry/Material reference
     * @param  {THREE.Vector3} position
     * @param  {Number} index of reference tree (random by default)
     */
    Game.prototype.newTree = function(position, type) {

        var self = this;

        // clone a tree
        var refTreeIndex = type || Math.round( Math.random() * (this._treesRefs.length - 1) );
        var refTree = self._treesRefs[ refTreeIndex ];
       
        var tree = new THREE.Mesh( refTree.geometry, refTree.material /* self._tree_shader */ );
        tree.castShadow = true;    
        tree.position = position;
        tree.scale = new THREE.Vector3(4, 4, 4);
        tree.rotation.y = Math.random() * 90 * ( Math.PI / 180 );

        if (refTreeIndex == 0) {
            tree.rotation.x = - 90 * ( Math.PI / 180 );
        }
        if (refTreeIndex == 1) {
            //tree.rotation.x = 10 * ( Math.PI / 180 );
            //tree.rotation.y = 10 * ( Math.PI / 180 );
            tree.rotation.z = 70 * ( Math.PI / 180 );
        }

        tree.matrixAutoUpdate = false;
        tree.updateMatrix();

        this._treesGroup = this._treesGroup || new THREE.Object3D();
        this._treesGroup.add( tree );
    };

    /**
     * Init some towers
     * @param  {Function} callback, called when finished
     */
    Game.prototype._initTowers = function(done) {

        var defenseTower = new DefenseTower(0, 28, 1, {
            fireSpeed: 10,
            fireIntensity: 50,
            transform: function (loaded) {
                var loaded = loaded.scene.children[0];
                loaded.castShadow = true;
                loaded.scale.set( 8, 8, 8 );
                loaded.rotation.x = -90 * (Math.PI / 180);
            }
        });
        this.scene.add(defenseTower);
        done(null);
    };

    /**
     * Fill map (ground, trees, towers, ...)
     * @param  {Function} main_callback, called when every elements has been added to scene
     */
    Game.prototype._fillMap = function(main_callback) {

        var self = this;

        async.series([
            _.bind( this._initGround, this),
            _.bind( this._initObjectives, this),
            _.bind( this._initSky, this),
            _.bind( this._initTrees,  this),
            _.bind( this._initTowers, this),
            function (callback) {
                // console.log('BYPASS TREES'); callback(); return;

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
            function (callback) {
                var loader = new THREE.OBJMTLLoader();
                loader.addEventListener('load', function (event) {
                    var object = event.content;
                    //object.position.set(-151, 0, 122);
                    object.position.set(-70, 17, 60);
                    object.children[0].scale.set(0.05, 0.05, 0.05);

                    var aura = Particles.Aura('point', 10, THREE.ImageUtils.loadTexture('/gamedata/textures/lensflare1_alpha.png'));
                    aura.particleCloud.position.set(1, 12, 5);
                    object.add(aura.particleCloud);
                    aura.start();

                    window._ta_events.bind('update', function(game){
                        aura.update(game.delta);
                    });

                    self.scene.add(object);
                    callback();
                });
                loader.load('/gamedata/models/lightning_pole/lightning_pole.obj', '/gamedata/models/lightning_pole/lightning_pole.mtl');
            },
            function(callback) {
                self.afterCreate();
                callback();
            }
        ], main_callback);
    };

    /**
     * Add a character. The first one the main one
     * @param {Entity} character
     * @param {THREE.Vector3} spawnPosition (map's spawn point by default)
     */
    Game.prototype.addCharacter = function(character, spawnPosition) {

        var self = this;
        var spawnPosition = spawnPosition || this.settings.positions.spawn;

        character.position.set(spawnPosition.x, spawnPosition.y, spawnPosition.z);

        // the first one, the main one
        if (this.pcs.length === 0) {
            this.hud.attachEntity(character);
        }

        character.traverse(function (child) {
            if (child instanceof THREE.Mesh && child.parent && ! child.parent instanceof LifeBar) {
                // FIXME: Some meshes cannot be used directly for collision (SkinnedMesh)
                // IDEA: Compute the whole character's bbox in the Character class, skipping weapons, tails, etc..
                // self.intersectObjects.push(child);

                child.castShadow = true;
            }
        });
        
        character.character.meshBody && this.intersectObjects.push(character.character.meshBody);

        this.pcs.push(character);
        this.scene.add(character);
    };

    /**
     * Remove a character from the scene 
     * @param  {Entity} character
     */
    Game.prototype.removeCharacter = function(character) {

        this.pcs = _.without(this.pcs, character);
        this.scene.remove(character);
    };


    Game.prototype.addSpawningPool = function(pool) {
        var self = this;
        this.scene.add(pool);
        pool.bind('spawnedone', function(character){
            self.addCharacter(character, pool.position);
        });
    };

    /**
     * Called after fillmap, before ready.
     * Useful for adding some details in the scene from subclasses
     * @param  {Function} callback, called when finished
     */
    Game.prototype.afterCreate = function() {

    };

    /**
     * Attach a listener for the next selection
     * @param  {Function} onSelection
     */
    Game.prototype.waitForSelection = function(onSelection) {

        this._waitForSelection = onSelection;
    };

    ////////////////////////////////

    /**
     * Set listeners to play the game in the browser
     */
    Game.prototype._initListeners = function() {

        this.settings.container.addEventListener('mouseup', _.bind( this.onDocumentMouseUp, this), false);
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

        switch (event.button) {
            default: 
              var vector = new THREE.Vector3(
                 (event.clientX / window.innerWidth) * 2 - 1,
                -(event.clientY / window.innerHeight) * 2 + 1,
                self.camera.near
              );
              
              var projector = new THREE.Projector();
              projector.unprojectVector(vector, self.camera);

              var raycaster = new THREE.Raycaster(self.camera.position,vector.sub(self.camera.position).normalize());

              var intersects = raycaster.intersectObjects(this.intersectObjects);

              if (intersects.length > 0) {

                var i_pos = intersects[0].point;

                console.log('intersect at %o %o', i_pos.x, i_pos.y, i_pos.z );

                // place helper
                // helper.position.set(0, 0, 0);
                // helper.lookAt(intersects[0].face.normal);
                // helper.position.copy(i_pos);

                var character = self.pcs[0];

                if (event.button == 2) {

                    self.endAllInteractions();

                    console.log('find a path between %o and %o', self.pcs[0].position, i_pos);

                    // run the magic
                    PathFinding.findPath(
                        this.pcs[0].position.x, this.pcs[0].position.y, this.pcs[0].position.z,
                        i_pos.x, i_pos.y, i_pos.z,
                        10000,
                        Utils.gcb( _.bind( character.moveAlong, character) )
                    );

                } else if (this._waitForSelection) {

                    var callback = this._waitForSelection;
                    this._waitForSelection = null;

                    callback(intersects);

                } else {

                    // __add_tree(i_pos);

                    // apply a glow effect on selected objects
                    if (intersects[0].object && intersects[0].object.parent && intersects[0].object.parent.parent
                        && intersects[0].object.parent.parent instanceof InteractiveObject) {

                        if (intersects[0].object.parent.parent.isNearEnough(character)) {
                            self.startInteraction(intersects[0].object.parent.parent);

                        } else {
                            console.log("C'est trop loin !");
                        }
                    }
                }

              } else {
                  console.log('no intersect');
              }
              break; 

        }
    };

    /**
     * Current selected objects
     * @type {Array}
     */
    Game.prototype._selected_objects = [];

    /**
     * End all not-near-enough interaction
     */
    Game.prototype.endAllInteractions = function () {

        var character = this.pcs[0];
        
        _.each(this._selected_objects, function (obj) {
            if (! obj.isNearEnough(character)) {
                obj.deselect();
            }
        });
    };

    /**
     * Begin a new interaction with an interactive object
     * @param  {InteractiveObject} interactiveObject
     */
    Game.prototype.startInteraction = function (interactiveObject) {

        this.endAllInteractions();
        this._selected_objects.push(interactiveObject);
        interactiveObject.select();
        this.hud.startInteraction(interactiveObject);
    };

    ////////////////////////////////

    /**
     * Start a new game
     *
     * @trigger 'start'
     */
    Game.prototype.start = function() {

        this._initListeners();

        this.hud.open();

        this.trigger('start');

        this.settings.splashContainer.className += ' animated fadeOutUpBig';
        this.settings.container.style.className += ' animated fadeInUpBig';
        this.settings.container.style.display = 'block';

        this._boundAnimate = _.bind( this.animate, this );
        this.animate();

        this._boundTimer = _.bind( this.timer, this );
        this.timer(this._boundTimer);
    };

    Game.prototype.timer = function() {

        this.trigger('everysec', this);
        setTimeout(this._boundTimer, 500);
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

        // stats.update()
        TWEEN.update();

        this.delta = this.clock.getDelta();

        window._ta_events.trigger('update', this);

        this.trigger('update', this);

        this.cameraControls.update(this.delta);
        this.camera.position.y = 80; // crraaaapp //

        /*
        this.directionalLight.target = this.pcs[0];
        this.directionalLight.position.set(
            this.pcs[0].position.x +  40,
            this.pcs[0].position.y +  80,
            this.pcs[0].position.z + -40
        );
        */

        _.each(this.pcs, function(character){
            character.update(self);
        });

        this.composer.render();
    };

    Entity.prototype.constructor = Entity;
    MicroEvent.mixin(Game);
    return Game;
});