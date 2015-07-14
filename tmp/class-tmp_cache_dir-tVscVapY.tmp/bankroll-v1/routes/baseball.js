define('bankroll-v1/routes/baseball', ['exports', 'ember', 'bankroll-v1/routes/authenticated'], function (exports, Ember, AunthenticatedRoute) {

	'use strict';

	var BaseballRoute = AunthenticatedRoute['default'].extend({
	});

	exports['default'] = BaseballRoute;

});