define('simple-auth-token/utils/get-global-config', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  var global = (typeof window !== 'undefined') ? window : {};

  exports['default'] = function(scope) {
    return Ember['default'].get(global, 'ENV.' + scope) || {};
  }

});