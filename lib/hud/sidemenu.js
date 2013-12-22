'use strict';

module.exports = Sidemenu;

function Sidemenu () {
  
  this.root = document.getElementById('hud-container');

  this.root.classList.add( 'animated' );
}

Sidemenu.prototype.css = '<style type="text/css"> #hud { position: absolute; top: 0; left: 0; bottom: 0; width: 20%; background: #222; opacity: .8; z-index: -10; } </style>';

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
  // return this.root.classList.contains( 'fadeInLeft' );
};