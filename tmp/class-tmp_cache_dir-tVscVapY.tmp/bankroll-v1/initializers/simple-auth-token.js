define('bankroll-v1/initializers/simple-auth-token', ['exports', 'simple-auth-token/configuration', 'simple-auth-token/authenticators/token', 'simple-auth-token/authorizers/token', 'bankroll-v1/config/environment'], function (exports, Configuration, Authenticator, Authorizer, ENV) {

  'use strict';

  exports['default'] = {
    name: 'simple-auth-token',
    before: 'simple-auth',
    initialize: function(container){
      Configuration['default'].load(container, ENV['default']['simple-auth-token'] || {});
      container.register('simple-auth-authorizer:token', Authorizer['default']);
      container.register('simple-auth-authenticator:token', Authenticator['default']);
    }
  };

});