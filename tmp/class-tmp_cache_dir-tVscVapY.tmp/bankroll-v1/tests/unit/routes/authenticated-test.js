define('bankroll-v1/tests/unit/routes/authenticated-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('route:authenticated', 'AuthenticatedRoute', {
    // Specify the other units that are required for this test.
    // needs: ['controller:foo']
  });

  ember_qunit.test('it exists', function() {
    var route = this.subject();
    ok(route);
  });

});