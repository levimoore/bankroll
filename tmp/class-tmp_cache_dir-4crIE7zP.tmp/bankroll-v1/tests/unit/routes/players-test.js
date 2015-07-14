define('bankroll-v1/tests/unit/routes/players-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('route:players', {
    // Specify the other units that are required for this test.
    // needs: ['controller:foo']
  });

  ember_qunit.test('it exists', function(assert) {
    var route = this.subject();
    assert.ok(route);
  });

});