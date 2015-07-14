define('bankroll-v1/models/user', ['exports', 'ember-data'], function (exports, DS) {

  'use strict';

  exports['default'] = DS['default'].Model.extend({
    username: DS['default'].attr('string'),
    email: DS['default'].attr('string')
  });

});