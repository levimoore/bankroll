define('bankroll-v1/routes/football', ['exports', 'ember', 'bankroll-v1/routes/authenticated'], function (exports, Ember, AunthenticatedRoute) {

	'use strict';

	var FootballRoute = AunthenticatedRoute['default'].extend({
	});

	exports['default'] = FootballRoute;

});