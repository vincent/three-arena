'use strict';

var _ = require('lodash');
var ko = require('knockout');

module.exports = QuestDialogViewModel;

/**
 * @exports threearena/views/dialogview
 */
function QuestDialogViewModel (quests, questGiver) {

    var self = this;

    this.questGiverName = ko.observable(questGiver.state.name);
    this.quests = ko.observable(quests);

    this.activeQuest = ko.observable(null);
    this.activeQuestStep = ko.observable(null);
    this.activeQuestDialog = ko.observable(null);

    ////////////////////////////////

    this.update = function(values) {
    };

    this.questChoices = function (choices) {
        return _.map(choices, function (consequence, label) {
            return {
                label: label,
                then: consequence
            };
        });
    };

    this.selectQuest = function (item) {
        self.activeQuest(item);
        var step = item.steps[item.step][self.questGiverName()];
        self.activeQuestStep(step);
        var dialog = Object.keys(step)[0];
        self.activeQuestDialog(dialog);
    };

    this.selectStepChoice = function (item) {
        var step = self.activeQuestStep();

        // function specified, call it
        if (_.isFunction(item.then)) {
            var then = item.then(questGiver.arena, questGiver);
            questGiver.emit('deselected');

            self.processStep(step, then);

        // string specified
        } else if (_.isString(item.then)) {
            self.processStep(step, item.then);
        }
    };

    this.processStep = function (step, then) {
        // jump to the next step
        if (then === 'next') {
            questGiver.arena.quests.step(self.activeQuest());
            questGiver.emit('deselected');

        // this is the end..
        } else if (then === 'end') {
            questGiver.emit('deselected');

        // assume scenario follow-up
        } else if (step[then]) {
            self.activeQuestDialog(then);
        }
    };
}
