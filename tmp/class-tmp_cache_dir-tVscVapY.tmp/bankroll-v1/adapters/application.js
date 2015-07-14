define('bankroll-v1/adapters/application', ['exports', 'ember-data', 'bankroll-v1/config/environment'], function (exports, DS, ENV) {

  'use strict';

  exports['default'] = DS['default'].RESTAdapter.extend({
    host: 'http://localhost:26080',
    namespace: 'api',
      headers: function() {
      if ( localStorage.getItem("access_token") ) {
        return { "Authorization": "Bearer "
            + localStorage.getItem("access_token") };
      }
      return {};
    //}.property().volatile(), // ensure value not cached
  }
  });

});