define([
	'./game',
	'./controls/dota',
	'./particles/cloud',
	'./elements/tower',
	'./huds/sidemenu',
], function ( Game, DotaControls, Cloud, DefenseTower, Sidemenu ) {

	return {
		__VERSION: '0.0.0',
		CameraControls: DotaControls,
		Hud: Sidemenu,
		Towers: {
			DefenseTower: DefenseTower,
		},
		Cloud: Cloud,
		Game: Game
	}
});