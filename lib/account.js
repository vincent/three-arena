'use strict';

var cookies = require('cookies-js');
var dict    = require('./character/dictionnaries/elvish');

module.exports = {

    username: function () {

        var username = cookies.get('username');

        if (! username) {

            username = prompt('What is your name ?');

            if (username.trim().length === 0) {
                username = dict[~~(Math.random() * dict.length)];
            }

            cookies.set('username', username);
        }

        return username;
    }
};
