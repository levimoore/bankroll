define('bankroll-v1/models/nflteam', ['exports', 'ember-data'], function (exports, DS) {

	'use strict';

	exports['default'] = DS['default'].Model.extend({
		players: DS['default'].hasMany('player', {async: true}),
		city: DS['default'].attr('string'),
		conf: DS['default'].attr('string'),
		logo: DS['default'].attr('string'),
		wins: DS['default'].attr('number'),
		losses: DS['default'].attr('number'),
		teamName: DS['default'].attr('string')
	});

});