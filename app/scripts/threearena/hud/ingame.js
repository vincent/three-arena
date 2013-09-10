
define('threearena/hud/ingame',
	['lodash', 'jquery', 'threejs', 'threearena/log', 'threearena/utils', 'threearena/entity'], function(_, $, THREE, log, Utils, Entity) {

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
		this.root.style.zIndex = 10000;
	};

	GameHud.prototype.close = function () {

		this.root.classList.remove( 'fadeInDownBig' );
		this.root.classList.add( 'fadeOutDownBig' );
		this.root.style.zIndex = -2;
		this.root.style.height = 0;
	};

	GameHud.prototype.isOpen = function () {

		return this.root.style.zIndex > 0;
		return this.root.classList.contains( 'fadeInDownBig' );
	};

	//////////////////////////////

	GameHud.prototype.set = function (type, selector, value) {

		switch (type) {

			case Utils.HUD_TYPE_STYLE:
				$(selector, this.root).css(value);
				break;

			case Utils.HUD_TYPE_TEXT:
				$(selector, this.root).html(value);
				break;

			case Utils.HUD_TYPE_IMAGE:
				$(selector, this.root).attr('src', value);
				break;

			default:
				throw (typeof type) + ' is not a valid hud type';
		}

	}

	GameHud.prototype.detachEntity = function () {

		this._attachedEntity.off('changed', _.bind(this._entityChangedListener, this));
	};

	GameHud.prototype.attachEntity = function (entity) {

		if (entity instanceof Entity) {

			this._attachedEntity = entity;
			this._attachedEntity.on('changed', _.bind(this._entityChangedListener, this));

			// fake event
			this._entityChangedListener({
				name: entity.options.name,
				image: entity.options.image,
				level: entity.options.level
			});

		} else {
			throw entity + ' is not an entity';
		}
	}

	GameHud.prototype._entityChangedListener = function(data) {
		
		var self = this;
		_.each(data, function(value, property){

			switch (property) {
				case 'life':
				case 'mana':
					self.set(Utils.HUD_TYPE_STYLE, '.portrait .portrait-' + property + ' .bar', { width: (value*100) + '%' });
					break;

				case 'name':
					self.set(Utils.HUD_TYPE_TEXT, '.portrait .portrait-'  + property, value);
					break;

				case 'image':
					self.set(Utils.HUD_TYPE_STYLE, '.portrait .portrait-' + property, { background: 'url('+value+') no-repeat 0 0' });
					break;

				default:
					log(log.SYS_DEBUG, '%o is not bound to the hud', property);
			}
		})
	};

	return GameHud;
});

