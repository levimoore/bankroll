define('bankroll-v1/routes/basketball', ['exports', 'ember', 'bankroll-v1/routes/authenticated'], function (exports, Ember, AunthenticatedRoute) {

	'use strict';

	var BasketballRoute = AunthenticatedRoute['default'].extend({
	});

	exports['default'] = BasketballRoute;

});