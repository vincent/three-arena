'use strict';

var _ = require('lodash');
var ko = require('knockout');

var InteractiveObject = require('../elements/interactiveobject');
// var DialogObject = require('../elements/dialogobject');

var InteractiveView = require('../views/interactiveview');
var DialogView = require('../views/dialogview');
var QuestDialogView = require('../views/questdialogview');

var EntityView = require('../views/entityview');
var GameView = require('../views/gameview');
var Entity = require('../entity');

module.exports = GameHud;

function GameHud (element) {

  this.root = element instanceof Node ? element : document.getElementById(element);

  this.root.classList.add('animated');

  ///////////////////////

  this.questsMenu = {
    dom: document.getElementById('view-questmenu'),
    model: ko.observable()
  };
  ko.applyBindings(this.questsMenu, this.questsMenu.dom);

  ///////////////////////

  this._attachedEntity = null;
  this._attachedEntityListeners = [];

  this.root.addEventListener('click', function(event){
    event.preventDefault();
    event.stopPropagation();
    return false;
  }, false);
}

GameHud.prototype.open = function () {

  this.root.classList.remove( 'fadeOutDownBig' );
  this.root.classList.add( 'fadeInUpBig' );
  this.root.style.display = 'block';
  this.root.style.height = '200px';
};

GameHud.prototype.close = function () {

  this.root.classList.remove( 'fadeInUpBig' );
  this.root.classList.add( 'fadeOutDownBig' );
  this.root.style.height = 0;
};

GameHud.prototype.isOpen = function () {

  return this.root.classList.contains( 'fadeInUpBig' );
};

//////////////////////////////

GameHud.prototype.attachEntity = function (entity) {

  if (entity instanceof Entity) {
    this.currentEntity = entity;

    this.entityview = new EntityView(entity, this.arena);
    ko.applyBindings(this.entityview, document.getElementById('view-character'));

  } else {
    throw entity + ' is not an Entity instance';
  }
};

GameHud.prototype.attachGame = function (game) {

  var domElement;

  // MAP
  this.gameview = new GameView(game);
  this.arena = game;
  domElement = document.getElementById('view-map');
  ko.applyBindings(this.gameview, domElement);
  domElement.addEventListener('wheel', this._onMapMouseScroll.bind(this), false );
  $(domElement).bind('DOMMouseScroll', this._onMapMouseScroll.bind(this), false ); // firefox


    this.questsMenu


  this.arena.settings.container.addEventListener('keyup', this.keyup.bind(this), false);
};

GameHud.prototype._onMapMouseScroll = function(event) {
  debugger;
};

GameHud.prototype.keyup = function(event) {

  var spell;

  switch( event.keyCode ) {

    case 49: // 1
      spell = this.currentEntity.state.spells[0];
      break;
    case 50:
      spell = this.currentEntity.state.spells[1];
      break;
    case 51:
      spell = this.currentEntity.state.spells[2];
      break;
    case 52:
      spell = this.currentEntity.state.spells[3];
      break;
  }

  if (spell) {
    this.entityview.cast(spell, null);
  }
};

GameHud.prototype.startInteraction = function(object) {

  var viewModel;
  var domElement;

  if (object instanceof InteractiveObject) {

    viewModel = new InteractiveView(object);
    domElement = document.getElementById('view-contextmenu');

  } else if (object.dialog) {

    viewModel = new DialogView(object.dialog);
    domElement = document.getElementById('view-dialogmenu');

  } else if (object.quests()) {

    this.questsMenu.model(new QuestDialogView(object.quests(), object));
    viewModel = this.questsMenu.model;
    domElement = this.questsMenu.dom;

  }

  if (! viewModel) {
    throw object + ' is not an Entity instance';
  }

  if (! domElement._ta_open) {
    domElement._ta_open = true;
    domElement.style.display = 'block';
  }
  object.on('deselected', function(){
    domElement._ta_open = false;
    domElement.style.display = 'none';
  });

};

