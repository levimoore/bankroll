define('bankroll-v1/routes/signup', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    setupController: function(controller, context) {
      controller.reset();
    }
  });

});