'use strict';

var inherits = require('inherits');
var Promise  = require('bluebird');

module.exports = Tree;

var cachedTreeGeometry;
var cachedTreeMaterial;
var trees;

var treeLoader = new Promise(function(resolve) {

  if (cachedTreeGeometry) return callback(cachedTreeGeometry, cachedTreeMaterial);

  var loader = new THREE.OBJLoader();

  loader.load( '/gamedata/elements/tree.obj', function ( object ) {

    object = object.children[0];

    cachedTreeMaterial = object.material;
    cachedTreeMaterial.map = THREE.ImageUtils.loadTexture( '/gamedata/textures/tree.png' );
    cachedTreeMaterial.alphaMap = THREE.ImageUtils.loadTexture( '/gamedata/textures/tree_alpha.png' );
    cachedTreeMaterial.map.needsUpdate = true;
    cachedTreeMaterial.alphaMap.needsUpdate = true;
    cachedTreeMaterial.transparent = true;

    cachedTreeGeometry = object.geometry;
    cachedTreeGeometry.dynamic = false;

    resolve({
      geometry: cachedTreeGeometry,
      material: cachedTreeMaterial
    });
  });

});

/**
 * @exports threearena/elements/Tree
 */
function Tree (options) {

  options = options || {};

  THREE.Object3D.apply(this, [ options ]);

  var self = this;

  self.isBlocking = 10.0;

  treeLoader.then(function (template) {

    var object = new THREE.Mesh(template.geometry, template.material);

    object.scale.set(7, 7, 7);

    self.add(object);

    if (options.onLoad) { options.onLoad.apply(self); }

  });

}

inherits(Tree, THREE.Object3D);
