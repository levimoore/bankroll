define('bankroll-v1/models/league', ['exports', 'ember-data'], function (exports, DS) {

  'use strict';

  exports['default'] = DS['default'].Model.extend({
    leagueName: DS['default'].attr('string'),
    description: DS['default'].attr('string'),
    member: DS['default'].attr('string')
  });

});