define('bankroll-v1/tests/unit/models/login-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForModel('login', 'Login', {
    // Specify the other units that are required for this test.
    needs: []
  });

  ember_qunit.test('it exists', function() {
    var model = this.subject();
    // var store = this.store();
    ok(!!model);
  });

});