'use strict'

var settings = require('../settings')

var DestinationMarker  = require('../controls/destinationmarker')

module.exports = function (arena) {

  /**
   * The unique destination marker, repositioned on every moves
   * @type {DestinationMarker}
   */
  arena.destinationMarker = new DestinationMarker(arena)

  arena.scene.add(arena.destinationMarker)

  arena.on('click:move', function (position) {

    arena.destinationMarker.position.copy(position)
    arena.destinationMarker.animate()
  })
}

