define('bankroll-v1/routes/bankroll', ['exports', 'ember', 'bankroll-v1/routes/authenticated'], function (exports, Ember, AunthenticatedRoute) {

	'use strict';

	var BankrollRoute = AunthenticatedRoute['default'].extend({
	});

	exports['default'] = BankrollRoute;

});