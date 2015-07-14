define('emberfire/initializers/emberfire', ['exports', 'ember', 'ember-data', 'firebase', 'emberfire/adapters/firebase', 'emberfire/serializers/firebase'], function (exports, Ember, DS, Firebase, FirebaseAdapter, FirebaseSerializer) {

  'use strict';

  var VERSION = '1.4.3';

  if (Ember['default'].libraries) {
    if (Firebase['default'].SDK_VERSION) {
      Ember['default'].libraries.registerCoreLibrary('Firebase', Firebase['default'].SDK_VERSION);
    }

    Ember['default'].libraries.registerCoreLibrary('EmberFire', VERSION);
  }

  exports['default'] = {
    name: 'emberfire',
    before: 'store',
    initialize: function (container, app) {
      app.register('adapter:-firebase', FirebaseAdapter['default']);
      app.register('serializer:-firebase', FirebaseSerializer['default']);

      // Monkeypatch the store until ED gives us a good way to listen to push events
      DS['default'].Store.reopen({
        push: function(typeName, data, _partial) {
          var record = this._super(typeName, data, _partial);
          var adapter = this.adapterFor(record.constructor);
          if (adapter.recordWasPushed) {
            adapter.recordWasPushed(this, typeName, record);
          }
          return record;
        },

        recordWillUnload: function(record) {
          var adapter = this.adapterFor(record.constructor);
          if (adapter.recordWillUnload) {
            adapter.recordWillUnload(this, record);
          }
        },

        recordWillDelete: function (record) {
          var adapter = this.adapterFor(record.constructor);
          if (adapter.recordWillDelete) {
            adapter.recordWillDelete(this, record);
          }
        }
      });

      DS['default'].Model.reopen({
        unloadRecord: function() {
          this.store.recordWillUnload(this);
          return this._super();
        },
        deleteRecord: function () {
          this.store.recordWillDelete(this);
          this._super();
        }
      });

      DS['default'].FirebaseAdapter = FirebaseAdapter['default'];
      DS['default'].FirebaseSerializer = FirebaseSerializer['default'];
    }
  };

});