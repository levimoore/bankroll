define('bankroll-v1/tests/unit/models/post-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForModel('post', 'Post', {
    // Specify the other units that are required for this test.
    needs: []
  });

  ember_qunit.test('it exists', function() {
    var model = this.subject();
    // var store = this.store();
    ok(!!model);
  });

});