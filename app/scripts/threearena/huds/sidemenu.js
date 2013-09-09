
define('threearena/huds/sidemenu',
	['lodash', 'threejs'], function(_, THREE) {

	var Sidemenu = function () {
		
		this.root = document.getElementById('hud-container');

		this.root.classList.add( 'animated' );
	};

	Sidemenu.prototype.open = function () {

		this.root.classList.remove( 'fadeOutLeft' );
		//this.root.classList.add( 'fadeInLeft' );
		this.root.style.zIndex = 10000;
	};

	Sidemenu.prototype.close = function () {

		this.root.classList.remove( 'fadeInLeft' );
		//this.root.classList.add( 'fadeOutLeft' );
		this.root.style.zIndex = -2;
	};

	Sidemenu.prototype.isOpen = function () {

		return this.root.style.zIndex > 0;
		return this.root.classList.contains( 'fadeInLeft' );
	};

	return {
		Sidemenu: Sidemenu
	}

});

