
define('threearena/game',
    ['lodash', 'async', 'threejs', 'tweenjs',

    'threearena/utils',
    'threearena/hud',
    'threearena/elements/tower', 
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
    Particles,
    CameraControls,
    PathFinding
 
) {
    PathFinding = Module;

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

    Game.prototype.preload = function(done) {

        Config = {};
        PathFinding.set_cellSize(1);
        PathFinding.set_cellHeight(1);
        PathFinding.initWithFile('/gamedata/maps/mountains.obj');
        PathFinding.build();
        require(this.settings.preload, done);

    };

    Game.prototype.init = function( ready ) {

        this.settings.container.innerHTML = '';

        //////////

        this._trees  = [];
        this.towers = [];
        this.ground = null;

        //////////

        this.pcs = [];

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

        this._fillMap( ready );
    };

    Game.prototype._initCamera = function() {

        this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 10000 );
        this.camera.position.set( this.settings.positions.spawn.x + 20, 50, this.settings.positions.spawn.z + 30 );
    };

    Game.prototype._initScene = function() {

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2( 0x0, 0.00055 );
        this.scene.fog = new THREE.Fog( 0x000000, 1, 200 );
    };

    Game.prototype._initLights = function() {

        this.ambientLight = new THREE.AmbientLight( 0xffffff );
        this.scene.add( this.ambientLight );

        this.pointLight = new THREE.PointLight( 0xffffff, 1.25, 1000 );
        this.pointLight.position.set( 0, 0, 600 );
        this.scene.add( this.pointLight );

        this.directionalLight = new THREE.SpotLight( 0xffffff );
        this.directionalLight.position.set( 0, 10, 0 );
        this.scene.add( this.directionalLight );
    };

    Game.prototype._initRenderer = function() {
        this.renderer = new THREE.WebGLRenderer();
        // this.renderer.shadowMapEnabled = true;
        // this.renderer.shadowMapSoft = true;
        // this.renderer.shadowCameraNear = 3;
        // this.renderer.shadowCameraFar = camera.far;
        // this.renderer.shadowCameraFov = 50;

        this.renderer.autoClear = false;
        this.renderer.gammaInput = true;
        this.renderer.gammaOutput = true;
        this.renderer.physicallyBasedShading = true;

        // this.renderer.shadowMapBias = 0.0039;
        // this.renderer.shadowMapDarkness = 0.5;
        // this.renderer.shadowMapWidth = window.innerWidth;
        // this.renderer.shadowMapHeight = window.innerHeight;
        this.renderer.setSize( window.innerWidth, window.innerHeight );

        var renderModel = new THREE.RenderPass( this.scene, this.camera );
        var effectBleach = new THREE.ShaderPass( THREE.BleachBypassShader );
        var effectColor = new THREE.ShaderPass( THREE.ColorCorrectionShader );
        var effectFXAA = new THREE.ShaderPass( THREE.FXAAShader );

        effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
        effectBleach.uniforms[ 'opacity' ].value = 0.4;
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

    Game.prototype._initGround = function(done) {
        var groundGeometry = new THREE.PlaneGeometry(500, 500, 1, 1);
        var groundMaterial = new THREE.MeshBasicMaterial({ color:'#ddd' });

        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        done();
    };

    Game.prototype._initTrees = function(main_callback) {
        var self = this;

        var loader = new THREE.ColladaLoader();

        var _load_tree_pine = function(callback){
            loader.load( '/gamedata/tree_pine.dae', function ( object ) {
                object.scene.children[1].material.materials[0].transparent = true;
                object.scene.children[1].material.materials[1].transparent = true;
                self._trees.push(object.scene.children[1]);
                callback();
            });
        };

        var _load_tree_oak = function(callback){
            loader.load( '/gamedata/tree_oak.dae', function ( object ) {
                object.scene.children[0].material.materials[0].transparent = true;
                object.scene.children[0].material.materials[1].transparent = true;
                self._trees.push(object.scene.children[0]);
                callback();
            });
        };

        async.series([ _load_tree_pine, _load_tree_oak ], main_callback);
    };

    Game.prototype.newTree = function(position, type) {

        var self = this;

        // clone a tree
        var refTreeIndex = type || Math.round( Math.random() * (this._trees.length - 1) );
        var refTree = self._trees[ refTreeIndex ];

        var tree = new THREE.Mesh( refTree.geometry, refTree.material );    
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

    Game.prototype._initTowers = function(done) {

        var defenseTower = new DefenseTower(0, 28, 1, {
            fireSpeed: 10,
            fireIntensity: 50,
            transform: function (loaded) {
                var loaded = loaded.scene.children[0];
                loaded.scale.set( 8, 8, 8 );
                loaded.rotation.x = -90 * (Math.PI / 180);
            }
        });
        this.scene.add(defenseTower);
        done(null);
    };

    Game.prototype._fillMap = function(main_callback) {

        var self = this;

        async.series([
            _.bind( this._initGround, this),
            _.bind( this._initTrees,  this),
            _.bind( this._initTowers, this),
            function (callback) {
                var loader = new THREE.OBJLoader();
                loader.load('/gamedata/dota_trees.obj', function (object) {
                    object.traverse(function (child) {
                        if (child instanceof THREE.Mesh) {
                            for (var i = 0; i < child.geometry.vertices.length && i < 50; i++) {
                                self.newTree(child.geometry.vertices[i]);
                            }
                        }
                    } );
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
            _.bind(this.afterCreate, this),
        ], main_callback);
    };

    Game.prototype.addCharacter = function(character, spawnPosition) {

        var spawnPosition = spawnPosition || this.settings.positions.spawn;

        character.position.set(spawnPosition.x, spawnPosition.y, spawnPosition.z);

        // the first one, the main one
        if (this.pcs.length === 0) {
            this.hud.attachEntity(character);
        }

        this.pcs.push(character);
        this.scene.add(character);
    };

    Game.prototype.removeCharacter = function(character) {

        this.pcs = _.without(this.pcs, character);
        this.scene.remove(character);
    };

    Game.prototype.afterCreate = function() {

    };

    ////////////////////////////////

    Game.prototype._initListeners = function() {

        this.settings.container.addEventListener('mouseup', _.bind( this.onDocumentMouseUp, this), false);
        this.settings.container.addEventListener('resize', _.bind( this.onWindowResize, this), false);
    };

    Game.prototype.onWindowResize = function() {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
    }


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

              var intersects = raycaster.intersectObjects(self.ground.children[0].children);

              if (intersects.length > 0) {

                var i_pos = intersects[0].point;

                console.log('intersect at %o %o', i_pos.x, i_pos.y, i_pos.z );

                // place helper
                // helper.position.set(0, 0, 0);
                // helper.lookAt(intersects[0].face.normal);
                // helper.position.copy(i_pos);

                if (event.button == 2) {
                    var character = self.pcs[0];

                    console.log('find a path between %o and %o', self.pcs[0].position, i_pos);

                    // run the magic
                    PathFinding.findPath(
                        this.pcs[0].position.x, this.pcs[0].position.y, this.pcs[0].position.z,
                        i_pos.x, i_pos.y, i_pos.z,
                        10000,
                        Utils.gcb( _.bind( character.moveAlong, character) )
                    );

                } else {

                    // __add_tree(i_pos);

                }

              } else {
                  console.log('no intersect');
              }
              break; 

        }
    }

    ////////////////////////////////

    Game.prototype.animate = function() {

        requestAnimationFrame( _.bind( this.animate, this ) );
        this.render();
    };

    Game.prototype.start = function() {

        var ThreeArenaGlobalEvents = function(){};
        MicroEvent.mixin(ThreeArenaGlobalEvents);

        window._ta_events = new ThreeArenaGlobalEvents();

        this._initListeners();

        this.hud.open();

        this.animate();
    };

    Game.prototype.render = function() {

        var self = this;

        // stats.update()
        TWEEN.update();

        this.delta = this.clock.getDelta();

        window._ta_events.trigger('update', this);

        this.cameraControls.update(this.delta);
        this.camera.position.y = 60; // crraaaapp //

        _.each(this.pcs, function(character){
            character.update(self.delta);
        });

        this.composer.render();
    };

    Entity.prototype.constructor = Entity;
    MicroEvent.mixin(Game);
    return Game;
});