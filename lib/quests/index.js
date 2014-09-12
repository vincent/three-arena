'use strict';

var _ = require('lodash');
var Hoodie = require('hoodie');
var hoodie;

var settings = require('../settings');

module.exports = Quests;

function Quests (arena) {

    var self = this;

    this.arena = arena;

    hoodie = hoodie || new Hoodie();
    this.store = hoodie.store;

    this.sprites = {};
    this.updateSprites();

    /* * /
    this.store.on('add:quest', function(object) {
        object._givers = self.involvedEntities(object.quest);
        console.log('new quest', object);
    });
    /* */

    // when store changes, update available quests
    this.store.on('change', function () {
        self.syncAvailableQuests();
    });

}

Quests.START = 1;
Quests.END = 2;
Quests.START_OTHER = 3;

Quests.prototype.updateSprites = function() {
    // update
    if (this.sprites[Quests.START]) {

    // create
    } else {
        var image;

        image = THREE.ImageUtils.loadTexture(settings.data.questSpriteStart);
        this.sprites[Quests.START] = new THREE.SpriteMaterial({
            map: image
        });

        image = THREE.ImageUtils.loadTexture(settings.data.questSpriteEnd);
        this.sprites[Quests.END] = new THREE.SpriteMaterial({
            map: image
        });
    }
};

//////////

Quests.prototype.add = function(quest) {
    this.store.add('quest', quest);
};

Quests.prototype.entities = function() {
    return this.arena.entities.map(function(e){
        if (! e.isDead()) return e.state.name;
    });
};

Quests.prototype.involvedEntities = function(quest) {

    return Object.keys(quest.steps[quest.step]);

    /*
    var involved = { starts:[], related:[], ends:[], all:[] };
    for (var i = quest.step; i < quest.steps.length; i++) {
        for (var npc in quest.steps[i]) {
            if (i === quest.steps.length - 1) {
                involved.ends.push(npc);
            } else if (i === 0) {
                involved.starts.push(npc);
            } else if (involved.related.indexOf(npc) === -1) {
                 involved.related.push(npc);
            }
            involved.all.push(npc);
        }
    }
    return involved;
    */
};

/* * /
Quests.prototype.canBeStartedBy = function(quest, entity) {
    for (var npc in quest.steps[0])
        if (npc == entity.state.name)
            return true;
    return false;
};
/* */

//////////

Quests.prototype.step = function(quest) {
    this.store.update('quest', quest.id, { step: quest.step+1 });
};

Quests.prototype.findRelatedQuests = function() {
    var self = this;
    var entities = this.entities();
    return this.store.findAll(function(quest){
        return _.intersection(self.involvedEntities(quest), entities).length > 0;
    });
};

Quests.prototype.clearQuests = function() {
    this.arena.entities.forEach(function (entity) {
        entity._quests = entity._quests || [];
        entity._quests.length = 0;
        if (entity.questMark) {
            entity.arena.scene2.remove(entity.questMark);
            entity.questMark = null; // should be enough to be GCed
        }
    });
};

Quests.prototype.syncAvailableQuests = function() {
    var self = this;
    this.findRelatedQuests()
        .always(function (quests) {
            self.clearQuests();
            quests.forEach(function (quest) {
                self.syncQuest(quest);
            });
        });
};

Quests.prototype.syncQuest = function(quest) {
    var self = this, questEntities;
    quest._givers = quest._givers || self.involvedEntities(quest);

    for (var i = 0; i < quest._givers.length; i++) {
        questEntities = self.arena.findAllEntitiesByName(quest._givers[i]);
        for (var j = 0; j < questEntities.length; j++) {
            questEntities[j]._quests.push(quest);
            self.markEntity(questEntities[j], quest.step === quest.steps.length - 1 ? Quests.END : Quests.START);
        }
    }
};

Quests.prototype.markEntity = function(entity, questMarkType) {
    // if (entity.questMark) return;

    var self = this;

    var entityQuestMarkChanged = function () {
        if (entity.questMark) {
            self.arena.scene2.remove(entity.questMark);
            entity.questMark = null; // should be enough to be GCed
        }
        entity.questMark = new THREE.Sprite(self.sprites[questMarkType]);
        entity.questMark.scale.set(10, 10, 0.01);
        self.arena.scene2.add(entity.questMark);
    };

    // update function
    var updateQuestMark = function (game) {
        if (entity.questMark) {
            // .. always above its character
            entity.questMark.position.set(
                entity.position.x,
                entity.position.y + entity.boundingBox.max.y * 3,
                entity.position.z
            );

            // .. always face camera
            entity.questMark.rotation.y = self.arena.camera.rotation.y;
        }
    };

    updateQuestMark.listenerTag = 'entity ' + entity.constructor.name + '#' + entity.id + ' quest mark update';

    entityQuestMarkChanged();

    self.arena.on('render', updateQuestMark);

    settings.on('entityQuestMarkChanged', entityQuestMarkChanged);
};
