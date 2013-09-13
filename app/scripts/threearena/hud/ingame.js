
define('threearena/hud/ingame',
	['lodash', 'jquery', 'threejs', 'knockout', 'threearena/views/entityview', 'threearena/views/gameview', 'threearena/log', 'threearena/utils', 'threearena/entity', 'threearena/game'],

	function(_, $, THREE, ko, EntityView, GameView, log, Utils, Entity, Game) {

	var GameHud = function (element) {
		
		this.root = element instanceof Node ? element : document.getElementById(element);

		this.root.classList.add('animated');

		///////////////////////

		this._attachedEntity = null;
		this._attachedEntityListeners = [];
	};

	GameHud.prototype.open = function () {

		this.root.classList.remove( 'fadeOutDownBig' );
		this.root.classList.add( 'fadeInDownBig' );
		this.root.style.display = 'block';
		this.root.style.height = '270px';
	};

	GameHud.prototype.close = function () {

		this.root.classList.remove( 'fadeInDownBig' );
		this.root.classList.add( 'fadeOutDownBig' );
		this.root.style.height = 0;
	};

	GameHud.prototype.isOpen = function () {

		return this.root.style.zIndex > 0;
		return this.root.classList.contains( 'fadeInDownBig' );
	};

	//////////////////////////////

	GameHud.prototype.attachEntity = function (entity) {

		if (entity instanceof Entity) {
			var viewModel = new EntityView(entity);
			ko.applyBindings(viewModel, document.getElementById('view-character'));

		} else {
			throw entity + ' is not an Entity instance';
		}
	};

	GameHud.prototype.attachGame = function (game) {

		var viewModel = new GameView(game);
		ko.applyBindings(viewModel, document.getElementById('view-map'));
	};


	return GameHud;
});

