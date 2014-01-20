'use strict';

var _ = require('lodash');
var TWEEN = require('tween');

module.exports = SpellTexts;

function SpellTexts (game, options) {

  var self = this;

  this.options = _.merge({
    font: 'helvetiker',
    weight: 'normal',
    style: 'normal',
  }, options);

  self.root = game.settings.container;

  self._bindEntity = function (entity) {
    entity.on('hit', self._showHit);
  };

  game.on('added:entity', self._bindEntity);

  self._showHit = function (eventData) {

    var textGeom = new THREE.TextGeometry( ''+eventData.totalLifeDamage, {
      size: Math.sqrt(eventData.totalLifeDamage),
      height: 1,
      curveSegments: 3,
      font: self.options.font,
      weight: self.options.weight,
      style: self.options.style,
      bevelThickness: 0,
      bevelSize: 0,
      bevelEnabled: false,
      material: 0,
      extrudeMaterial: 1
    });

    var hitMaterial = new THREE.MeshBasicMaterial({
      shading: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      color: 0xff0000,
      opacity: 1
    });
    var textMesh = new THREE.Mesh(textGeom, hitMaterial);

    self._tween(textMesh, eventData);
  };

  self._showHeal = function (eventData) {

    var textGeom = new THREE.TextGeometry(eventData.totalLifeDamage, {
      size: Math.max(Math.sqrt(eventData.totalLifeDamage), 1),
      height: 1,
      curveSegments: 1,
      font: self.options.font,
      weight: self.options.weight,
      style: self.options.style,
      bevelThickness: 0,
      bevelSize: 0,
      bevelEnabled: false,
      material: 0,
      extrudeMaterial: 0
    });

    var healMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      color: 0x00ff00,
      opacity: 1
    });

    var textMesh = new THREE.Mesh(textGeom, healMaterial);

    self._tween(textMesh, eventData);
  };

  self._tween = function (mesh, eventData) {

    eventData.spell.target.add(mesh);

    mesh.position.z = -2;
    mesh.position.y = 10;

    return new TWEEN.Tween({ y: 10, opacity: 1, scale: 0.2 })
      .to({ y: 20, opacity: 0, scale: 2 }, 1000)
      .easing( TWEEN.Easing.Quadratic.InOut)
      .onComplete(function(){
        eventData.spell.target.remove(mesh);
      })
      .onUpdate(function(){
        // console.log(this);
        // adjust position, opacity & size
        mesh.position.y = this.y;
        mesh.material.opacity = this.opacity;
        mesh.scale.set(this.scale, this.scale, this.scale);

        // always face camera
        mesh.rotation.y = eventData.spell.target.game.camera.rotation.y - eventData.spell.target.rotation.y;
      })
      .start();
  };
}
