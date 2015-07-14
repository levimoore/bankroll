define('bankroll-v1/initializers/simple-auth', ['exports', 'simple-auth/configuration', 'simple-auth/setup', 'bankroll-v1/config/environment'], function (exports, Configuration, setup, ENV) {

  'use strict';

  exports['default'] = {
    name:       'simple-auth',
    initialize: function(container, application) {
      Configuration['default'].load(container, ENV['default']['simple-auth'] || {});
      setup['default'](container, application);
    }
  };

});