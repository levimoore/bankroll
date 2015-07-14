define('bankroll-v1/routes/players', ['exports', 'ember'], function (exports, Ember) {

	'use strict';

	exports['default'] = Ember['default'].Route.extend({
		model: function() {
			this.modelFor('nflteam').get('players');
		}
	});

});