'use strict';

var _ = require('lodash');
var ko = require('knockout');

var settings = require('../settings');

module.exports = GameViewModel;

/**
 * @exports threearena/views/gameview
 */
function GameViewModel (game) {

  var self = this;

  this.game = game;

  ////////////////////////////////

  this._currentMap = null;

  ////////////////////////////////

  self.mapWidth = ko.observable(0);
  self.mapHeight = ko.observable(0);

  self.entities = ko.observableArray([
    ko.observable({ x: -1000, z: -1000, dead: false }),
  ]);

  this.image = ko.observable(null);
  this.orientation = ko.observable(null);
  this.mapZoom = ko.observable(null);
  this.mapOffsetX = ko.observable(0);
  this.mapOffsetY = ko.observable(0);

  this.minimapImageWidth = ko.observable(497);
  this.minimapImageHeight = ko.observable(498);

  this.minimapElementWidth = ko.observable(180);
  this.minimapElementHeight = ko.observable(176);

  this.minimapCover = ko.observable('initial');
  this.minimapOrigin = ko.observable('50% 50%');

  // this.orientation = ko.pureComputed(function() {
  //     return this.game.entity ? this.game.entity.rotation.y : 0;
  // }, this).extend({ rateLimit: 50 });

  // this.mapZoom = ko.pureComputed(function() {
  //     return 1;
  // }, this).extend({ rateLimit: 50 });

  ////////////////////////////////

  // find the main ground mesh,
  this.game.on('set:terrain', function() {

    var mapImage = null;

    // pass its texture mapImage
    if (game.ground.options.minimap && game.ground.options.minimap.defaultmap) {
      mapImage = game.ground.options.minimap.defaultmap;

    } else if (game.ground.options.minimap) {
      mapImage = game.ground.options.minimap.image;

    } else if (game.ground.options.tDiffuse) {
      mapImage = game.ground.options.tDiffuse.image;

    } else if (game.ground.options.map.image) {
      mapImage = game.ground.options.map.image;
    }

    if (mapImage) {
      self.image(mapImage.src);
      self.minimapImageWidth(mapImage.width);
      self.minimapImageHeight(mapImage.height);
    } else {
      // no mapImage :/
      // self.image();
    }

    game.ground.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
        var geometry = child.geometry;
        if (!geometry.boundingBox) {
          geometry.computeBoundingBox();
        }

        self.mapWidth(geometry.boundingBox.max.x - geometry.boundingBox.min.x);
        self.mapHeight(geometry.boundingBox.max.z - geometry.boundingBox.min.z);
      }
    });
  });

  this.round = function (num) {
    return Math.round(num * 10000) / 10000;
  }

  this.syncEntities = function (arena, entityPositionPercent) {
    _.each(arena.entities, function(c,i){
      if (self.entities()[i] === undefined) {
        self.entities.push(ko.observable({ x:-1000, z:-1000, dead: false }));
      }
    });
  };

  this.updateOrientation = function (arena) {
    self.orientation((arena.entity ? arena.entity.rotation.y : 0) - Math.PI / 2);
  };

  this.updateOrigin = function (arena, entityPositionPercent) {
    // update map zoom & rotation
    self.minimapOrigin(entityPositionPercent.x + '% ' + entityPositionPercent.z + '%');
  };

  this.updateZoom = function (arena) {
      var zoom = (100 * 50 / arena.camera.zoom);
      self.mapZoom(50 / arena.camera.zoom);
  };

  this.updateMapPosition = function (arena, entityPositionPercent) {
      var absMinimapOffsetX = -1 * entityPositionPercent.x * self.minimapImageWidth() / 100;
      var absMinimapOffsetY = -1 * (self.minimapImageHeight() - (entityPositionPercent.z * self.minimapImageHeight() / 100));

      var newX = absMinimapOffsetX + self.minimapElementWidth() / 2;
      var newY = absMinimapOffsetY + self.minimapElementHeight() / 2;

      self.mapOffsetX(self.round(newX));
      self.mapOffsetY(self.round(newY));
  };

  this.updateLevelMap = function (arena) {
    if (_.isObject(arena.ground.options.minimap)) {
      var found = false;
      _.each(arena.ground.options.minimap, function(image, key){
        if (found) { return; }

        var x = arena.entity.position.x,
            y = arena.entity.position.y,
            z = arena.entity.position.z;
        try {
          found = eval(key);
        } catch (e) { }

        if (found) {
          self.image(image.src);
          self.minimapImageWidth(image.width);
          self.minimapImageHeight(image.height);
        }
      });
    }
  };

  this.updateEntitiesAbsolute = function (arena) {
    // position playing characters
    _.each(arena.entities, function(c,i){
      var newX = 100 / self.mapWidth() * (arena.entities[i].position.x + self.mapWidth() / 2);
      var newY = 100 / self.mapHeight() * (arena.entities[i].position.z + self.mapHeight() / 2);

      self.entities()[i]({
        x: self.round(newX),
        z: self.round(newY),
        dead: arena.entities[i].isDead()
      });
    });
  };

  this.updateEntitiesRelative = function (arena, entityPositionPercent) {
    // position playing characters
    _.each(arena.entities, function(c,i){
      if (arena.entities[i] === arena.entity) {
        // position main entity at center
        self.entities()[0]({ x: 50, z: 50, dead: arena.entity.isDead() });
      } else {
        var relEntityPositionPercent = arena.inTerrainScreenPercentage(arena.entities[i].position);
        var relDiffPositionPercent = relEntityPositionPercent.sub(entityPositionPercent);

        relDiffPositionPercent.x *= self.minimapImageWidth() /  self.mapWidth();
        relDiffPositionPercent.z *=  self.minimapImageHeight() / self.mapHeight();

        relDiffPositionPercent.x += 50;
        relDiffPositionPercent.z = 50 - relDiffPositionPercent.z;

        self.entities()[i]({
          x: self.round(relDiffPositionPercent.x),
          z: self.round(relDiffPositionPercent.z),
          dead: arena.entities[i].isDead()
        });
      }
    });
  };

  this.update = function(arena) {

    // self.updateLevelMap(arena);

    self.syncEntities(arena);

    // if we use a player centered map
    if (settings.data.minimapType == settings.MINIMAP_RELATIVE && arena.entity) {

      this.minimapCover('initial');

      var entityPositionPercent = arena.inTerrainScreenPercentage(arena.entity.position);

      self.updateOrigin(arena, entityPositionPercent);

      if (settings.data.minimapZoom || settings.data.minimapRotate) {
        self.updateOrientation(arena);
      }

      if (settings.data.minimapRotate) {
        self.updateZoom(arena);
      }

      self.updateMapPosition(arena, entityPositionPercent);

      self.updateEntitiesRelative(arena, entityPositionPercent);

    // if we use an absolute positioned map
    } else /* if (settings.data.minimapType == minimap.MINIMAP_ABSOLUTE) */ {

      self.minimapCover('cover');
      self.mapOffsetX(0);
      self.mapOffsetY(0);
      self.orientation(0);

      self.updateEntitiesAbsolute(arena);
    }

  };

  this.game.on('render', this.update.bind(this));
}

GameViewModel.prototype.onMapClick = function(gameview, event) {
  // ignore if there's no button clicked, useful for ugly mousedrag event
  if (! event.which) { return; }

  var target = $(event.currentTarget);
  var halfX = gameview.mapWidth() / 2,
      halfZ = gameview.mapHeight() / 2,
      mapX = (gameview.mapWidth() / target.width() * event.offsetX) - halfX,
      mapZ = (gameview.mapHeight() / target.height() * event.offsetY) - halfZ + 40;

  this.game.camera.position.set(mapX, 50, mapZ);
};

GameViewModel.prototype.onCharacterHover = function(event) {
};
