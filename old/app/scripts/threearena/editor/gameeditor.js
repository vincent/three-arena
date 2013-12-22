
define('threearena/editor/gameeditor',
    ['lodash', 'threejs', 'zepto'], function(_, THREE, $) {

    /**
     * @exports threearena/editor/gameeditor
     */
    var Menu = function(game, options) {

        var self = this;

        this.options = _.merge({

        	container: '#editor'

        }, options);

        this.container = $(this.options.container);

        this.tab_game_components = $('#editor-game-components', this.container);
        this.tab_game_components.on('click', this._clickComponent);

        // this.tab_game_components = $('#editor-available-components', this.container);
        // this.tab_available_components.on('click', this._clickComponent);
    };

    Menu.prototype._clickComponent = function(id) {

    	// body...
    };

    return Menu;
});