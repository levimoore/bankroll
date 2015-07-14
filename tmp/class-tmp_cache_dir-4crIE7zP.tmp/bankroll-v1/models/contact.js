define('bankroll-v1/models/contact', ['exports', 'ember-data'], function (exports, DS) {

  'use strict';

  exports['default'] = DS['default'].Model.extend({
    bday: DS['default'].attr('string'),
    firstName: DS['default'].attr('string'),
    lastName: DS['default'].attr('string'),
    zodiac: DS['default'].attr('string')
  });

});