
define('threearena/hud/ingame',
	['lodash', 'jquery', 'threejs', 'knockout', 'threearena/views/entityview', 'threearena/views/gameview', 'threearena/views/interactiveview', 'threearena/elements/interactiveobject', 'threearena/log', 'threearena/utils', 'threearena/entity', 'threearena/game'],

	function(_, $, THREE, ko, EntityView, GameView, InteractiveView, InteractiveObject, log, Utils, Entity, Game) {

	var GameHud = function (element) {
		
		this.root = element instanceof Node ? element : document.getElementById(element);

		this.root.classList.add('animated');

		///////////////////////

		this._attachedEntity = null;
		this._attachedEntityListeners = [];

		this.root.addEventListener('click', function(event){
			event.preventDefault();
			event.stopPropagation();
			return false;
		}, false);
	};

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

			this.entityview = new EntityView(entity, this.currentGame);
			ko.applyBindings(this.entityview, document.getElementById('view-character'));

		} else {
			throw entity + ' is not an Entity instance';
		}
	};

	GameHud.prototype.attachGame = function (game) {

		this.gameview = new GameView(game);
		this.currentGame = game;
		ko.applyBindings(this.gameview, document.getElementById('view-map'));

		game.renderer.domElement.addEventListener('keyup', _.bind( this.keyup, this), false);
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

		if (object instanceof InteractiveObject) {
			var viewModel = new InteractiveView(object);
			var domElement = document.getElementById('view-contextmenu');
			if (! domElement._ta_open) {
				domElement._ta_open = true;
				domElement.style.display = 'block';
				ko.applyBindings(viewModel, domElement);
			}
			object.bind('deselected', function(){
				domElement._ta_open = false;
				domElement.style.display = 'none';
				ko.cleanNode(domElement);
			});

		} else {
			throw object + ' is not an Entity instance';
		}
	};

	return GameHud;
});

