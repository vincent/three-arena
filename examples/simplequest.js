'use strict';

var Arena = window.Arena;

var arena = window.arena = new Arena({
  container: document.getElementById('game-container'),

  lightAmbientColor: '#343434',
  lightPointColor: '#2aac8d',
  lightPointIntensity: 1.5,

});

arena.setTerrain('/gamedata/maps/simplest/flat.obj', {
  minimap: THREE.ImageUtils.loadTexture('/gamedata/maps/simplest/minimap.png'),

  cellSize: 0.9,          // nav mesh cell size (.8 > 2)
  cellHeight: 0.8,        // nav mesh cell height (.5 > 1)
  agentHeight: 2.0,       // character height (1.2 => 2)
  agentRadius: 0.8,       // character radius (.5 > 2)
  agentMaxClimb: 1.0,     // max units character can jump (1 > 5)
  agentMaxSlope: 50.0,    // max degre character can climb (20 > 40)
});

arena.addCharacter(function(done){
  new Arena.Characters.Dummy({
    name: prompt('What is your name, stranger ?'),
    maxSpeed: 15.0,
    onLoad: function(){
      this.learnSpell(Arena.Spells.Teleport);
      this.position.set(-5, 0, -5);
      arena.asPlayer(this);
      done(this);
    }
  });
});

arena.addCharacter(function(done){
  new Arena.Characters.Dummy({
    name: 'The elder',
    maxSpeed: 15.0,
    onLoad: function(){
      this.position.set(10, 0, -10);
      done(this);
    }
  });
});

arena.addCharacter(function(done){
  new Arena.Characters.Dummy({
    name: 'The master',
    maxSpeed: 15.0,
    onLoad: function(){
      this.position.set(-10, 0, 10);
      done(this);
    }
  });
});

arena.on('set:terrain', function(){
  arena.init(function(arena){
    arena.run();
  });
});

setTimeout(function(){
  arena.addQuest({
    id: 1,
    title: 'A brave new world',
    step: 0,
    steps: [
      {'The elder': {
        intro: {
          text: "Hello stranger,<br>I'm Pedro The Elder<br>Do you feel ... adventurous ?",
          choices: { 'Yes': 'dialog2', 'No': 'kthxbye' }},
        dialog2: {
          text: "I see... but aren't you too young for an adventure ?",
          choices: { 'Maybe': 'kthxbye', 'No !': 'tothemaster' }},
        tothemaster: {
          text: "Ok young padawan,<br>then you should talk to the master, up there.",
          choices: { 'I will': 'next', 'No': 'kthxbye' }},
        kthxbye: {
          text: "Well... see you, then...",
          choices: { 'Bye': 'end' }}
      }},
      {'The master': {
        dialog1: {
          text: "Hello stranger,<br>I'm Lucio The Master<br>So you feel adventurous, hum ?",
          choices: { 'Yes': 'dialog2', 'No': 'kthxbye' }},
        dialog2: {
          text: "Ho.. and do you really feel healthy enough ?",
          choices: { 'Maybe': 'kthxbye', 'No !': function () {
            return arena.entity.state.life > 50 ? 'tothemoon' : 'nothealthy';
          }}},
        nothealthy: {
          text: "Well... I don't think so...",
          choices: { 'Bye': 'end' }},
        tothemoon: {
          text: "Okay! To the moon !",
          choices: { 'Go !': function () {
            arena.entity.learnSpell(Arena.Spells.Heal);
          } }},
        kthxbye: {
          text: "Well... see you then...",
          choices: { 'Bye': 'end' }}
      }}
    ]
  });
}, 3000);
