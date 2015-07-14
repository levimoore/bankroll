define('bankroll-v1/routes/wagers', ['exports', 'ember', 'bankroll-v1/routes/authenticated'], function (exports, Ember, AunthenticatedRoute) {

	'use strict';

	var WagersRoute = AunthenticatedRoute['default'].extend({
	});

	exports['default'] = WagersRoute;

});