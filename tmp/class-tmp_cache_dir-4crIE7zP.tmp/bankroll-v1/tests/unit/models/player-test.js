define('bankroll-v1/tests/unit/models/player-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForModel('player', {
    // Specify the other units that are required for this test.
    needs: []
  });

  ember_qunit.test('it exists', function(assert) {
    var model = this.subject();
    // var store = this.store();
    assert.ok(!!model);
  });

});