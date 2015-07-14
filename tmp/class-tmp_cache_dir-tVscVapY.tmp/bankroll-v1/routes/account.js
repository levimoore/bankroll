define('bankroll-v1/routes/account', ['exports', 'ember', 'bankroll-v1/routes/authenticated'], function (exports, Ember, AunthenticatedRoute) {

  'use strict';

  var AccountRoute = AunthenticatedRoute['default'].extend({
    model: function() {
      return this.store.find('user');
    }
  });

  exports['default'] = AccountRoute;

});