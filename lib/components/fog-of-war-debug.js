'use strict';

var _ = require('lodash');

var FowMap = require('../textures/fog-of-war');

module.exports = function (arena) {

  arena.on('set:terrain', function () {

    var worldBBox = arena.ground.boundingBoxNormalized.max;

    var fowMap   = new FowMap(worldBBox.x, worldBBox.z);

    arena.settings.container.appendChild(fowMap.canvas);

    fowMap.canvas.style.position = 'absolute';
    fowMap.canvas.style.right  = '0';
    fowMap.canvas.style.top    = '100px';

    arena.on('update', function () {
      fowMap.render(
        _.map(arena.entities, function (e) {
          return arena.inTerrainDatum(e.position);
        })
      );
    });

  });

};

