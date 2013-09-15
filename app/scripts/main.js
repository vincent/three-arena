THREE = {};

require.config({
    waitSeconds: 10 * 60 * 1000,
    paths: {
        cacheonly:      'libs/cacheonly',

        jquery:         '../bower_components/jquery/jquery',
        lodash:         '../bower_components/lodash/lodash',
        async:          '../bower_components/async/lib/async',
        threejs:        '../bower_components/threejs/build/three',
        knockout:       '../bower_components/knockout.js/knockout', // not by KO's mainteners
        microevent:     '../bower_components/microevent.js/microevent',
        sparks:         '../bower_components/threejs/examples/js/Sparks',
        tweenjs:        '../bower_components/tween.js/build/tween.min',
        knockoutmapping:'../bower_components/knockout-mapping/knockout.mapping',

        MD2Character:   '../bower_components/threejs/examples/js/MD2Character',
        MD2CharacterComplex: '../bower_components/threejs/examples/js/MD2CharacterComplex',
        OBJLoader:      '../bower_components/threejs/examples/js/loaders/OBJLoader',
        MTLLoader:      '../bower_components/threejs/examples/js/loaders/MTLLoader',
        OBJMTLLoader:   '../bower_components/threejs/examples/js/loaders/OBJMTLLoader',
        ColladaLoader:  '../bower_components/threejs/examples/js/loaders/ColladaLoader',
        TrackballControls: '../bower_components/threejs/examples/js/controls/TrackballControls',
        EditorControls: '../bower_components/threejs/examples/js/controls/EditorControls',
        ConvexGeometry: '../bower_components/threejs/examples/js/geometries/ConvexGeometry',
        BleachBypassShader: '../bower_components/threejs/examples/js/shaders/BleachBypassShader',
        ColorCorrectionShader: '../bower_components/threejs/examples/js/shaders/ColorCorrectionShader',
        CopyShader:     '../bower_components/threejs/examples/js/shaders/CopyShader',
        FXAAShader:     '../bower_components/threejs/examples/js/shaders/FXAAShader',
        EffectComposer: '../bower_components/threejs/examples/js/postprocessing/EffectComposer',
        RenderPass:     '../bower_components/threejs/examples/js/postprocessing/RenderPass',
        ShaderPass:     '../bower_components/threejs/examples/js/postprocessing/ShaderPass',
        MaskPass:       '../bower_components/threejs/examples/js/postprocessing/MaskPass',
    },

    shim: {
        microevent: {
            exports: 'MicroEvent',
        },

        tweenjs: {
            exports: 'TWEEN',
        },
        threejs: {
            exports: 'THREE',
        },
        sparks: {
            exports: 'SPARKS',
            deps: [ 'threejs' ]
        },
        threearena: {
            exports: 'THREEARENA',
            deps: [ 'threejs' ]
        },
        MD2Character: {
            exports: 'THREE.MD2Character',
            deps: [ 'threejs' ]
        },
        MD2CharacterComplex: {
            exports: 'THREE.MD2CharacterComplex',
            deps: [ 'threejs' ]
        },
        OBJLoader: {
            exports: 'THREE.OBJLoader',
            deps: [ 'threejs' ]
        },
        MTLLoader: {
            exports: 'THREE.MTLLoader',
            deps: [ 'threejs' ]
        },
        OBJMTLLoader: {
            exports: 'THREE.OBJMTLLoader',
            deps: [ 'threejs' ]
        },
        ColladaLoader: {
            exports: 'THREE.ColladaLoader',
            deps: [ 'threejs' ]
        },
        TrackballControls: {
            exports: 'THREE.TrackballControls',
            deps: [ 'threejs' ]
        },
        EditorControls: {
            exports: 'THREE.EditorControls',
            deps: [ 'threejs' ]
        },
        ConvexGeometry: {
            exports: 'THREE.ConvexGeometry',
            deps: [ 'threejs' ]
        },
        BleachBypassShader: {
            exports: 'THREE.BleachBypassShader',
            deps: [ 'threejs' ]
        },
        ColorCorrectionShader: {
            exports: 'THREE.ColorCorrectionShader',
            deps: [ 'threejs' ]
        },
        CopyShader: {
            exports: 'THREE.CopyShader',
            deps: [ 'threejs' ]
        },
        FXAAShader: {
            exports: 'THREE.FXAAShader',
            deps: [ 'threejs' ]
        },
        EffectComposer: {
            exports: 'THREE.EffectComposer',
            deps: [ 'threejs' ]
        },
        RenderPass: {
            exports: 'THREE.RenderPass',
            deps: [ 'threejs' ]
        },
        ShaderPass: {
            exports: 'THREE.ShaderPass',
            deps: [ 'threejs' ]
        },
        MaskPass: {
            exports: 'THREE.MaskPass',
            deps: [ 'threejs' ]
        }
    }
});

require([ 'lodash', 'threejs', 'threearena/examples/demo' ], function ( _, THREE, Demo ) {
    'use strict';

    // Launch demo
    var game = window.game = new Demo();

    var playButton = document.getElementById('game-play');

    var preload = function preload() {
        playButton.innerHTML = 'Downloading ...';
        playButton.removeEventListener('click', preload);

        setTimeout(function(){
            game.preload(init);
        }, 100);
    }

    var init = function init() {
        playButton.innerHTML = 'Ready';
        playButton.removeEventListener('click', init);

        playButton.addEventListener('click', play);
    }

    var play = function play(callback) {
        game.init(function () {
            setTimeout(function(){
                game.start();
            }, 2000)
        });
    }

    playButton.addEventListener('click', preload);
});
