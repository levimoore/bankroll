define('bankroll-v1/tests/unit/models/team-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForModel('team', {
    // Specify the other units that are required for this test.
    needs: []
  });

  ember_qunit.test('it exists', function(assert) {
    var model = this.subject();
    // var store = this.store();
    assert.ok(!!model);
  });

});