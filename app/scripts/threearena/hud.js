
define('threearena/hud',
    ['threearena/hud/ingame', 'threearena/hud/sidemenu'],

    function(GameHud, Sidemenu) {

    	return {
    		GameHud: GameHud,
    		Sidemenu: Sidemenu
    	};
});

