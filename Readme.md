Three Arena
===

Demo
===
http://ec2-54-228-33-93.eu-west-1.compute.amazonaws.com:9000


Current status
===
![Current status](https://raw.github.com/vincent/three-arena/master/app/images/screenshots/2013-09-09.png)


Examples
===
{{{

new Arena({

  container: 'game-container', // the container DOM ID

  showRoutes: true // show characters route paths
})

.setTerrain('/gamedata/maps/simplest.obj', { // use this .OBJ as terrain

  tDiffuse: '/gamedata/textures/plain_blue.png' // the terrain texture
})

.addCharacter(function(done){ // add a character

  new Ogro({

    name: 'Shrek', // the character name

    image: '/gamedata/unknown.png', // its portrait

    tomb: '/gamedata/models/rts_elements.dae', // use this model when it dies

    life: 100, // start with 100 life points

    onLoad: function(){

      this.learnSpell(FireBulletSpell); // learn a spell

      done(this); // on scene !
    }
  });
  
});
    
}}}


Show me the code
===

* The main game codebase is in the [threearena directory](app/scripts/threearena)
* Libraries used
 - RequireJS
 - Lo-Dash
 - Async
 - ThreeJS (r60), TweenJS, Sparks
 - Knockout
 - jQuery (only when really useful)
