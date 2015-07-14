define('bankroll-v1/routes/soccer', ['exports', 'ember', 'bankroll-v1/routes/authenticated'], function (exports, Ember, AunthenticatedRoute) {

  'use strict';

  var SoccerRoute = AunthenticatedRoute['default'].extend({
    model: function() {
      return this.store.find('contact');
    }
  });

  exports['default'] = SoccerRoute;

});