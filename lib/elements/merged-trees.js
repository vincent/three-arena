'use strict';

var inherits = require('inherits');

module.exports = MergedTrees;

/**
 * @exports threearena/elements/Tree
 */
function MergedTrees (options) {

  options = options || {};

  THREE.Object3D.apply(this, [ options ]);

  this.offset  = -1;

  var geometry = new THREE.BufferGeometry();

  // itemSize = 3 because there are 3 values (components) per vertex
  geometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( 100 * 300 * 3 ), 3 ) );
  geometry.addAttribute( 'normal'  , new THREE.BufferAttribute( new Float32Array( 100 * 300 * 3 ), 3 ) );
  geometry.addAttribute( 'uv'      , new THREE.BufferAttribute( new Float32Array( 100 * 300 * 3 ), 3 ) );
  var material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );

  this.trees = new THREE.Mesh( geometry, material );

}

inherits(MergedTrees, THREE.Object3D);

MergedTrees.prototype.merge = function(tree) {

  // var geometry;

  if (! this.trees) {

    this.trees = tree;

  // } else if (this.trees.geometry instanceof THREE.Geometry && tree.geometry instanceof THREE.BufferGeometry) {

  //   geometry = new THREE.Geometry();

  //   this.trees.geometry.merge(geometry.fromBufferGeometry(tree.geometry), tree.matrix);
  //   this.trees.material = tree.material;

  // } else if (this.trees.geometry instanceof THREE.BufferGeometry && tree.geometry instanceof THREE.Geometry) {

  //   geometry = new THREE.BufferGeometry();

  //   this.trees.geometry.merge(tree.geometry.fromGeometry(tree.geometry), ++this.offset);
  //   this.trees.material = tree.material;

  } else if (this.trees.geometry instanceof THREE.BufferGeometry) {

    // transform vertices
    var tmpv = new THREE.Vector3();

    var array = tree.geometry.attributes.position.array;
    for (var i = 0; i < tree.geometry.attributes.position.array.length - 2; i+=3) {

      tmpv.set(array[i], array[i+1], array[i+2]);

      tmpv.applyMatrix4(tree.matrix);

      array[i]   = tmpv.x;
      array[i+1] = tmpv.y;
      array[i+2] = tmpv.z;
    }

    this.trees.geometry.merge(tree.geometry, ++this.offset * 300);
    this.trees.material = tree.material;

  // } else if (this.trees.geometry instanceof THREE.Geometry) {

  //   this.trees.geometry.merge(tree.geometry, tree.matrix);
  //   this.trees.material = tree.material;

  }

  this.add(this.trees);

};