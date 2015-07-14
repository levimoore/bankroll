define('bankroll-v1/routes/nflteams', ['exports', 'ember'], function (exports, Ember) {

	'use strict';

	exports['default'] = Ember['default'].Route.extend({
		model: function(params){
			return this.store.find('nflteam');
		}
	});

});