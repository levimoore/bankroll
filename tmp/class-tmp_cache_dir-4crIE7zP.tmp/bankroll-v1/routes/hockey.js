define('bankroll-v1/routes/hockey', ['exports', 'ember', 'bankroll-v1/routes/authenticated'], function (exports, Ember, AunthenticatedRoute) {

	'use strict';

	var HockeyRoute = AunthenticatedRoute['default'].extend({
	});

	exports['default'] = HockeyRoute;

});