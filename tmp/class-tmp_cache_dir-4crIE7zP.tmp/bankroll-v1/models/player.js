define('bankroll-v1/models/player', ['exports', 'ember-data'], function (exports, DS) {

	'use strict';

	exports['default'] = DS['default'].Model.extend({
		firstName: DS['default'].attr('string'),
		lastName: DS['default'].attr('string'),
		number: DS['default'].attr('number'),
		pos: DS['default'].attr('string'),
		height: DS['default'].attr('string'),
		weight: DS['default'].attr('string'),
		age: DS['default'].attr('number'),
		college: DS['default'].attr('Florida State'),
		squad: DS['default'].attr('Defense'),
		team: DS['default'].attr("string"),
		nflteam: DS['default'].belongsTo('nflteam', {async: true})  
	});

});