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
        microevent:     '../bower_components/microevent/microevent',
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
        tweenjs: {
            exports: 'TWEEN',
        },
        threejs: {
            exports: 'THREE',
        },
        sparks: {
            exports: 'SPARKS',
        },
        threearena: {
            exports: 'THREEARENA',
        },
        MD2Character: {
            exports: 'THREE.MD2Character'
        },
        MD2CharacterComplex: {
            exports: 'THREE.MD2CharacterComplex'
        },
        OBJLoader: {
            exports: 'THREE.OBJLoader'
        },
        MTLLoader: {
            exports: 'THREE.MTLLoader'
        },
        OBJMTLLoader: {
            exports: 'THREE.OBJMTLLoader'
        },
        ColladaLoader: {
            exports: 'THREE.ColladaLoader'
        },
        TrackballControls: {
            exports: 'THREE.TrackballControls'
        },
        EditorControls: {
            exports: 'THREE.EditorControls'
        },
        ConvexGeometry: {
            exports: 'THREE.ConvexGeometry'
        },
        BleachBypassShader: {
            exports: 'THREE.BleachBypassShader'
        },
        ColorCorrectionShader: {
            exports: 'THREE.ColorCorrectionShader'
        },
        CopyShader: {
            exports: 'THREE.CopyShader'
        },
        FXAAShader: {
            exports: 'THREE.FXAAShader'
        },
        EffectComposer: {
            exports: 'THREE.EffectComposer'
        },
        RenderPass: {
            exports: 'THREE.RenderPass'
        },
        ShaderPass: {
            exports: 'THREE.ShaderPass'
        },
        MaskPass: {
            exports: 'THREE.MaskPass'
        }
    }
});

require([ 'lodash', 'threejs', 'threearena/examples/demo' ], function ( _, THREE, Demo ) {
    'use strict';

    // Launch demo
    var game = window.game = new Demo();

    var playButton = document.getElementById('game-play');
    playButton.addEventListener('click', function(){
        game.preload(function (argument) {

            game.init( _.bind(game.start, game));
        });
    });

});
