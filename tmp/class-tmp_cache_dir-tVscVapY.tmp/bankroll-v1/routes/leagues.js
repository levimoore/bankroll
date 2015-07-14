define('bankroll-v1/routes/leagues', ['exports', 'ember', 'ember-data', 'simple-auth/mixins/authenticated-route-mixin'], function (exports, Ember, DS, AuthenticatedRouteMixin) {

	'use strict';

	exports['default'] = Ember['default'].Route.extend(AuthenticatedRouteMixin['default'],{
		  model: function(){
	    return this.store.find('league');
		}
	});

});