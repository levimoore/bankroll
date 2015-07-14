define('bankroll-v1/routes/nflteam', ['exports', 'ember'], function (exports, Ember) {

	'use strict';

	exports['default'] = Ember['default'].Route.extend({
		model: function(params){
			return this.store.find('nflteam', params.nflteam_id);
		}
	});

});