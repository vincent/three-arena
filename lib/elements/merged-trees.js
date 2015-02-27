'use strict';

var inherits = require('inherits');
var Promise  = require('bluebird');

module.exports = MergedTrees;

/**
 * @exports threearena/elements/Tree
 */
function MergedTrees (options) {

  options = options || {};

  THREE.Object3D.apply(this, [ options ]);

  this.trees   = null;
  this.offset  = 0;
}

inherits(MergedTrees, THREE.Object3D);

MergedTrees.prototype.merge = function(tree) {
    if (! this.trees) {
        this.trees = tree;
    } else {
        this.trees.children[0].geometry.merge(tree.children[0].geometry, this.offset++);
    }

    this.add(this.trees);
};