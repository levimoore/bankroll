define('bankroll-v1/routes/league', ['exports', 'ember', 'ember-data', 'simple-auth/mixins/authenticated-route-mixin'], function (exports, Ember, DS, AuthenticatedRouteMixin) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend(AuthenticatedRouteMixin['default'],{
  	  model: function(params){
      return this.store.find('league', params.league_id);
    }
  });

});