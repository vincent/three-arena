
define('threearena/hud',
    ['threearena/hud/ingame', 'threearena/hud/sidemenu'],

    /**
     * @exports threearena/hud
     */
    function(GameHud, Sidemenu) {

    	return {
    		GameHud: GameHud,
    		Sidemenu: Sidemenu
    	};
});

