define('bankroll-v1/routes/application', ['exports', 'simple-auth/mixins/application-route-mixin'], function (exports, ApplicationRouteMixin) {

	'use strict';

	//application.js
	exports['default'] = Ember.Route.extend(ApplicationRouteMixin['default']);

});