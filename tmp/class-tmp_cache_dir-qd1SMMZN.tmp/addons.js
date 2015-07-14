define("EmberFire", ["EmberFire/index","exports"], function(__index__, __exports__) {
  "use strict";
  Object.keys(__index__).forEach(function(key){
    __exports__[key] = __index__[key];
  });
});

define('emberfire/adapters/firebase', ['exports', 'ember', 'ember-data', 'emberfire/utils/to-promise'], function (exports, Ember, DS, toPromise) {

  'use strict';

  var fmt = Ember['default'].String.fmt;
  var Promise = Ember['default'].RSVP.Promise;
  var forEach = Ember['default'].EnumerableUtils.forEach;
  var filter = Ember['default'].EnumerableUtils.filter;
  var map = Ember['default'].EnumerableUtils.map;
  var indexOf = Ember['default'].EnumerableUtils.indexOf;

  var uniq = function (arr) {
    var ret = Ember['default'].A();

    arr.forEach(function(k) {
      if (indexOf(ret, k) < 0) {
        ret.push(k);
      }
    });

    return ret;
  };

  /**
    The Firebase adapter allows your store to communicate with the Firebase
    realtime service. To use the adapter in your app, extend DS.FirebaseAdapter
    and customize the endpoint to point to the Firebase URL where you want this
    data to be stored.

    The adapter will automatically communicate with Firebase to persist your
    records as neccessary. Importantly, the adapter will also update the store
    in realtime when changes are made to the Firebase by other clients or
    otherwise.
  */
  exports['default'] = DS['default'].Adapter.extend(Ember['default'].Evented, {

    defaultSerializer: '-firebase',

    /**
      Endpoint paths can be customized by setting the Firebase property on the
      adapter:

      ```js
      DS.FirebaseAdapter.extend({
        firebase: new Firebase('https://<my-firebase>.firebaseio.com/')
      });
      ```

      Requests for `App.Post` now target `https://<my-firebase>.firebaseio.com/posts`.

      @property firebase
      @type {Firebase}
    */

    init: function() {
      var firebase = this.get('firebase');
      if (!firebase || typeof firebase !== 'object') {
        throw new Error('Please set the `firebase` property on the adapter.');
      }
      // If provided Firebase reference was a query (eg: limits), make it a ref.
      this._ref = firebase.ref();
      // Keep track of what types `.findAll()` has been called for
      this._findAllMapForType = {};
      // Keep a cache to check modified relationships against
      this._recordCacheForType = {};
      // Used to batch records into the store
      this._queue = [];
    },

    /**
      Uses push() to generate chronologically ordered unique IDs.
    */
    generateIdForRecord: function() {
      return this._getKey(this._ref.push());
    },

    /**
      Use the Firebase DataSnapshot's key as the record id

      @param {Object} snapshot - A Firebase snapshot
      @param {Object} payload - The payload that will be pushed into the store
      @return {Object} payload
    */
    _assignIdToPayload: function(snapshot) {
      var payload = snapshot.val();
      if (payload !== null && typeof payload === 'object' && typeof payload.id === 'undefined') {
        payload.id = this._getKey(snapshot);
      }
      return payload;
    },

    /**
      Called by the store to retrieve the JSON for a given type and ID. The
      method will return a promise which will resolve when the value is
      successfully fetched from Firebase.

      Additionally, from this point on, the object's value in the store will
      also be automatically updated whenever the remote value changes.
    */
    find: function(store, type, id) {
      var adapter = this;
      var ref = this._getRef(type, id);

      return new Promise(function(resolve, reject) {
        ref.once('value', function(snapshot) {
          var payload = adapter._assignIdToPayload(snapshot);
          adapter._updateRecordCacheForType(type, payload);
          if (payload === null) {
            var error = new Error(fmt('no record was found at %@', [ref.toString()]));
                error.recordId = id;
            reject(error);
          }
          else {
            resolve(payload);
          }
        },
        function(err) {
          reject(err);
        });
      }, fmt('DS: FirebaseAdapter#find %@ to %@', [type, ref.toString()]));
    },

    recordWasPushed: function(store, type, record) {
      if (!record.__listening) {
        this.listenForChanges(store, type, record);
      }
    },

    recordWillUnload: function(store, record) {
      var ref = this._getRef(record.typeKey, record.get('id'));
      ref.off('value');
    },

    recordWillDelete: function(store, record) {
      var adapter = this;

      record.eachRelationship(function (key, relationship) {
        if (relationship.kind === 'belongsTo') {
          var parentRecord = record.get(relationship.key);
          var inverseKey = record.inverseFor(relationship.key);
          if (inverseKey && parentRecord.get('id')) {
            var parentRef = adapter._getRef(inverseKey.type, parentRecord.get('id'));
            adapter._removeHasManyRecord(store, parentRef, inverseKey.name, record.id);
          }
        }
      });
    },

    listenForChanges: function(store, type, record) {
      record.__listening = true;
      var serializer = store.serializerFor(type);
      var adapter = this;
      var ref = this._getRef(type, record.get('id'));
      var called = false;
      ref.on('value', function(snapshot) {
        if (called) {
          adapter._handleChildValue(store, type, serializer, snapshot);
        }
        called = true;
      });
    },

    /**
     findMany
    */
    findMany: undefined,

    /**
      Called by the store to retrieve the JSON for all of the records for a
      given type. The method will return a promise which will resolve when the
      value is successfully fetched from Firebase.

      Additionally, from this point on, any records of this type that are added,
      removed or modified from Firebase will automatically be reflected in the
      store.
    */
    findAll: function(store, type) {
      var adapter = this;
      var ref = this._getRef(type);

      return new Promise(function(resolve, reject) {
        // Listen for child events on the type
        ref.once('value', function(snapshot) {
          if (!adapter._findAllHasEventsForType(type)) {
            adapter._findAllAddEventListeners(store, type, ref);
          }
          var results = [];
          snapshot.forEach(function(childSnapshot) {
            var payload = adapter._assignIdToPayload(childSnapshot);
            adapter._updateRecordCacheForType(type, payload);
            results.push(payload);
          });
          resolve(results);
        }, function(error) {
          reject(error);
        });
      }, fmt('DS: FirebaseAdapter#findAll %@ to %@', [type, ref.toString()]));
    },

    findQuery: function(store, type, query) {
      var adapter = this;
      var ref = this._getRef(type);

      ref = this.applyQueryToRef(ref, query);

      return new Promise(function(resolve, reject) {
        // Listen for child events on the type
        ref.once('value', function(snapshot) {
          if (!adapter._findAllHasEventsForType(type)) {
            adapter._findAllAddEventListeners(store, type, ref);
          }
          var results = [];
          snapshot.forEach(function(childSnapshot) {
            var payload = adapter._assignIdToPayload(childSnapshot);
            adapter._updateRecordCacheForType(type, payload);
            results.push(payload);
          });
          resolve(results);
        }, function(error) {
          reject(error);
        });
      }, fmt('DS: FirebaseAdapter#findQuery %@ with %@', [type, query]));
    },

    applyQueryToRef: function (ref, query) {

      if (!query.orderBy) {
        query.orderBy = '_key';
      }

      if (query.orderBy === '_key'){
        ref = ref.orderByKey();
      } else if (query.orderBy === '_value') {
        ref = ref.orderByValue();
      } else if (query.orderBy === '_priority') {
        ref = ref.orderByPriority();
      } else {
        ref = ref.orderByChild(query.orderBy);
      }

      ['limitToFirst', 'limitToLast', 'startAt', 'endAt', 'equalTo'].forEach(function (key) {
        if (query[key] || query[key] === '') {
          ref = ref[key](query[key]);
        }
      });

      return ref;
    },

    /**
      Keep track of what types `.findAll()` has been called for
      so duplicate listeners aren't added
    */
    _findAllMapForType: undefined,

    /**
      Determine if the current type is already listening for children events
    */
    _findAllHasEventsForType: function(type) {
      return !Ember['default'].isNone(this._findAllMapForType[type]);
    },

    /**
      After `.findAll()` is called on a type, continue to listen for
      `child_added`, `child_removed`, and `child_changed`
    */
    _findAllAddEventListeners: function(store, type, ref) {
      this._findAllMapForType[type] = true;

      var adapter = this;
      var serializer = store.serializerFor(type);

      ref.on('child_added', function(snapshot) {
        if (!store.hasRecordForId(type, adapter._getKey(snapshot))) {
          adapter._handleChildValue(store, type, serializer, snapshot);
        }
      });
    },

    /**
      Push a new child record into the store
    */
    _handleChildValue: function(store, type, serializer, snapshot) {
      //No idea why we need this, we are alredy turning off the callback by
      //calling ref.off in recordWillUnload. Something is fishy here
      if (store.isDestroying) {
        return;
      }
      var value = snapshot.val();
      if (value === null) {
        var id = this._getKey(snapshot);
        var record = store.getById(type, id);
        //TODO refactor using ED
        if (!record.get('isDeleted')) {
          record.deleteRecord();
        }
      } else {
        var payload = this._assignIdToPayload(snapshot);
        this._enqueue(function() {
          store.push(type, serializer.extractSingle(store, type, payload));
        });
      }
    },

    /**
      `createRecord` is an alias for `updateRecord` because calling \
      `ref.set()` would wipe out any existing relationships
    */
    createRecord: function(store, type, record) {
      var adapter = this;
      return this.updateRecord(store, type, record).then(function() {
        adapter.listenForChanges(store, type, record);
      });
    },

    /**
      Called by the store when a record is created/updated via the `save`
      method on a model record instance.

      The `updateRecord` method serializes the record and performs an `update()`
      at the the Firebase location and a `.set()` at any relationship locations
      The method will return a promise which will be resolved when the data and
      any relationships have been successfully saved to Firebase.

      We take an optional record reference, in order for this method to be usable
      for saving nested records as well.

    */
    updateRecord: function(store, type, record, _recordRef) {
      var adapter = this;
      var recordRef = _recordRef || this._getRef(type, record.id);
      var recordCache = adapter._getRecordCache(type.typeKey, record.get('id'));

      var serializedRecord = record.serialize({includeId:false});

      return new Promise(function(resolve, reject) {
        var savedRelationships = Ember['default'].A();
        record.eachRelationship(function(key, relationship) {
          var save;
          if (relationship.kind === 'hasMany') {
            if (serializedRecord[key]) {
              save = adapter._saveHasManyRelationship(store, type, relationship, serializedRecord[key], recordRef, recordCache);
              savedRelationships.push(save);
              // Remove the relationship from the serializedRecord because otherwise we would clobber the entire hasMany
              delete serializedRecord[key];
            }
          } else {
            if (relationship.options.embedded === true && serializedRecord[key]) {
              save = adapter._saveBelongsToRecord(store, type, relationship, serializedRecord[key], recordRef);
              savedRelationships.push(save);
              delete serializedRecord[key];
            }
          }
        });

        var relationshipsPromise = Ember['default'].RSVP.allSettled(savedRelationships);
        var recordPromise = adapter._updateRecord(recordRef, serializedRecord);

        Ember['default'].RSVP.hashSettled({relationships: relationshipsPromise, record: recordPromise}).then(function(promises) {
          var rejected = Ember['default'].A(promises.relationships.value).filterBy('state', 'rejected');
          if (promises.record.state === 'rejected') {
            rejected.push(promises.record);
          }
          // Throw an error if any of the relationships failed to save
          if (rejected.length !== 0) {
            var error = new Error(fmt('Some errors were encountered while saving %@ %@', [type, record.id]));
                error.errors = rejected.mapBy('reason');
            reject(error);
          } else {
            resolve();
          }
        });
      }, fmt('DS: FirebaseAdapter#updateRecord %@ to %@', [type, recordRef.toString()]));
    },

    //Just update the record itself without caring for the relationships
    _updateRecord: function(recordRef, serializedRecord) {
      return toPromise['default'](recordRef.update, recordRef, [serializedRecord]);
    },

    /**
      Call _saveHasManyRelationshipRecord on each record in the relationship
      and then resolve once they have all settled
    */
    _saveHasManyRelationship: function(store, type, relationship, ids, recordRef, recordCache) {
      if (!Ember['default'].isArray(ids)) {
        throw new Error('hasMany relationships must must be an array');
      }
      var adapter = this;
      var idsCache = Ember['default'].A(recordCache[relationship.key]);
      var dirtyRecords = [];

      // Added
      var addedRecords = filter(ids, function(id) {
        return !idsCache.contains(id);
      });

      // Dirty
      dirtyRecords = filter(ids, function(id) {
        var type = relationship.type;
        return store.hasRecordForId(type, id) && store.getById(type, id).get('isDirty') === true;
      });

      dirtyRecords = map(uniq(dirtyRecords.concat(addedRecords)), function(id) {
        return adapter._saveHasManyRecord(store, relationship, recordRef, id);
      });

      // Removed
      var removedRecords = filter(idsCache, function(id) {
        return !ids.contains(id);
      });

      removedRecords = map(removedRecords, function(id) {
        return adapter._removeHasManyRecord(store, recordRef, relationship.key, id);
      });
      // Combine all the saved records
      var savedRecords = dirtyRecords.concat(removedRecords);
      // Wait for all the updates to finish
      return Ember['default'].RSVP.allSettled(savedRecords).then(function(savedRecords) {
        var rejected = Ember['default'].A(Ember['default'].A(savedRecords).filterBy('state', 'rejected'));
        if (rejected.get('length') === 0) {
          // Update the cache
          recordCache[relationship.key] = ids;
          return savedRecords;
        }
        else {
          var error = new Error(fmt('Some errors were encountered while saving a hasMany relationship %@ -> %@', [relationship.parentType, relationship.type]));
              error.errors = Ember['default'].A(rejected).mapBy('reason');
          throw error;
        }
      });
    },

    /**
      If the relationship is `async: true`, create a child ref
      named with the record id and set the value to true

      If the relationship is `embedded: true`, create a child ref
      named with the record id and update the value to the serialized
      version of the record
    */
    _saveHasManyRecord: function(store, relationship, parentRef, id) {
      var ref = this._getRelationshipRef(parentRef, relationship.key, id);
      var record = store.getById(relationship.type, id);
      var isEmbedded = relationship.options.embedded === true;
      if (isEmbedded) {
        return this.updateRecord(store, relationship.type, record, ref);
      }

      return toPromise['default'](ref.set, ref,  [true]);
    },

    /**
      Remove a relationship
    */
    _removeHasManyRecord: function(store, parentRef, key, id) {
      var ref = this._getRelationshipRef(parentRef, key, id);
      return toPromise['default'](ref.remove, ref, [], ref.toString());
    },

    /**
      Save an embedded record
    */
    _saveBelongsToRecord: function(store, type, relationship, id, parentRef) {
      var ref = parentRef.child(relationship.key);
      var record = store.getById(relationship.type, id);
      return this.updateRecord(store, relationship.type, record, ref);
    },

    /**
      Called by the store when a record is deleted.
    */
    deleteRecord: function(store, type, record) {
      var ref = this._getRef(type, record.get('id'));
      return toPromise['default'](ref.remove, ref);
    },

    /**
      Determines a path fo a given type
    */
    pathForType: function(type) {
      var camelized = Ember['default'].String.camelize(type);
      return Ember['default'].String.pluralize(camelized);
    },

    /**
      Return a Firebase reference for a given type and optional ID.
    */
    _getRef: function(type, id) {
      var ref = this._ref;
      if (type) {
        ref = ref.child(this.pathForType(type.typeKey));
      }
      if (id) {
        ref = ref.child(id);
      }
      return ref;
    },

    /**
      Return a Firebase reference based on a relationship key and record id
    */
    _getRelationshipRef: function(ref, key, id) {
      return ref.child(key).child(id);
    },

    /**
      The amount of time (ms) before the _queue is flushed
    */
    _queueFlushDelay: (1000/60), // 60fps

    /**
      Called after the first item is pushed into the _queue
    */
    _queueScheduleFlush: function() {
      Ember['default'].run.later(this, this._queueFlush, this._queueFlushDelay);
    },

    /**
      Call each function in the _queue and the reset the _queue
    */
    _queueFlush: function() {
      forEach(this._queue, function(queueItem) {
        var fn = queueItem[0];
        var args = queueItem[1];
        fn.apply(null, args);
      });
      this._queue.length = 0;
    },

    /**
      Push a new function into the _queue and then schedule a
      flush if the item is the first to be pushed
    */
    _enqueue: function(callback, args) {
      //Only do the queueing if we scheduled a delay
      if (this._queueFlushDelay) {
        var length = this._queue.push([callback, args]);
        if (length === 1) {
          this._queueScheduleFlush();
        }
      } else {
        callback.apply(null, args);
      }
    },

    /**
      A cache of hasMany relationships that can be used to
      diff against new relationships when a model is saved
    */
    _recordCacheForType: undefined,

    /**
      _updateHasManyCacheForType
    */
    _updateRecordCacheForType: function(type, payload) {
      if (!payload) { return; }
      var id = payload.id;
      var typeKey = type.typeKey;
      var cache = this._getRecordCache(typeKey, id);
      // Only cache relationships for now
      type.eachRelationship(function(key, relationship) {
        if (relationship.kind === 'hasMany') {
          var ids = payload[key];
          cache[key] = !Ember['default'].isNone(ids) ? Ember['default'].A(Ember['default'].keys(ids)) : Ember['default'].A();
        }
      });
    },

    /**
      Get or create the cache for a record
     */
    _getRecordCache: function (typeKey, id) {
      var cache = this._recordCacheForType;
      cache[typeKey] = cache[typeKey] || {};
      cache[typeKey][id] = cache[typeKey][id] || {};
      return cache[typeKey][id];
    },

    /**
     * A utility for retrieving the key name of a Firebase ref or
     * DataSnapshot. This is backwards-compatible with `name()`
     * from Firebase 1.x.x and `key()` from Firebase 2.0.0+. Once
     * support for Firebase 1.x.x is dropped in EmberFire, this
     * helper can be removed.
     */
    _getKey: function(refOrSnapshot) {
      return (typeof refOrSnapshot.key === 'function') ? refOrSnapshot.key() : refOrSnapshot.name();
    }
  });

});
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
define('emberfire/serializers/firebase', ['exports', 'ember', 'ember-data'], function (exports, Ember, DS) {

  'use strict';

  var map = Ember['default'].EnumerableUtils.map;
  var fmt = Ember['default'].String.fmt;

  /**
    The Firebase serializer helps normalize relationships and can be extended on
    a per model basis.
  */
  exports['default'] = DS['default'].JSONSerializer.extend(Ember['default'].Evented, {

    //We need to account for Firebase turning key/value pairs with ids '1' and '0' into arrays
    //See https://github.com/firebase/emberfire/issues/124
    _normalizeNumberIDs: function(hash, key) {
      var newHash = [];
      if (hash[key][0] === true) {
        newHash.push('0');
      }
      if (hash[key][1] === true) {
        newHash.push('1');
      }
      hash[key] = newHash;
    },

    normalizeHasMany: function(type, hash, relationship) {
      var key = relationship.key;
      if (typeof hash[key] === 'object' && !Ember['default'].isArray(hash[key])) {
        hash[key] = Ember['default'].keys(hash[key]);
      }
      //We need to account for Firebase turning key/value pairs with ids '1' and '0' into arrays
      //See https://github.com/firebase/emberfire/issues/124
      else if (Ember['default'].isArray(hash[key]) && hash[key].length < 3 && (hash[key][0] === true || hash[key][1] === true)) {
        this._normalizeNumberIDs(hash, key);
      }
      else if (Ember['default'].isArray(hash[key])) {
        throw new Error(fmt('%@ relationship %@(\'%@\') must be a key/value map in Firebase. Example: { "%@": { "%@_id": true } }', [type.toString(), relationship.kind, relationship.type.typeKey, key, relationship.type.typeKey]));
      }
    },

    normalizeEmbeddedHasMany: function(type, hash, relationship) {
      var key = relationship.key;
      var embeddedRecordPayload = hash[key];
      var embeddedKey;
      if (!hash[key]) {
        return;
      }
      for (embeddedKey in embeddedRecordPayload) {
        var record = embeddedRecordPayload[embeddedKey];
        if (record !== null && typeof record === 'object') {
          record.id = embeddedKey;
        }
        this.store.push(relationship.type, this.normalize(relationship.type, record));
      }
      hash[key] = Ember['default'].keys(hash[key]);
    },

    normalizeEmbeddedBelongsTo: function(type, hash, relationship) {
      var key = relationship.key;
      if (!hash[key]) {
        return;
      }
      var embeddedRecordPayload = hash[key];
      if (typeof embeddedRecordPayload.id !== 'string') {
        throw new Error(fmt('Embedded relationship "%@" of "%@" must contain an "id" property in the payload', [relationship.type.typeKey, type]));
      }
      this.store.push(relationship.type, this.normalize(relationship.type, embeddedRecordPayload));
      hash[key] = embeddedRecordPayload.id;
    },

    normalizeBelongsTo: Ember['default'].K,
    /**
      Called after `extractSingle()`. This method checks the model
      for `hasMany` relationships and makes sure the value is an object.
      The object is then converted to an Array using `Ember.keys`
    */
    normalize: function(type, hash) {
      var serializer = this;
      // Check if the model contains any 'hasMany' relationships
      type.eachRelationship(function(key, relationship) {
        if (relationship.kind === 'hasMany') {
          if (relationship.options.embedded) {
            serializer.normalizeEmbeddedHasMany(type, hash, relationship);
          } else {
            serializer.normalizeHasMany(type, hash, relationship);
          }
        } else {
          if (relationship.options.embedded) {
            serializer.normalizeEmbeddedBelongsTo(type, hash, relationship);
          } else {
            serializer.normalizeBelongsTo(type, hash, relationship);
          }
        }
      });
      return this._super.apply(this, arguments);
    },

    /**
      Called on a records returned from `find()` and all records
      returned from `findAll()`

      This method also checkes for `embedded: true`, extracts the
      embedded records, pushes them into the store, and then replaces
      the records with an array of ids
    */
    extractSingle: function(store, type, payload) {
      return this.normalize(type, payload);
    },

    /**
      Called after the adpter runs `findAll()` or `findMany()`. This method runs
      `extractSingle()` on each item in the payload and as a result each item
      will have `normalize()` called on it
    */
    extractArray: function(store, type, payload) {
      return map(payload, function(item) {
        return this.extractSingle(store, type, item);
      }, this);
    },

    /**
      Overrides ember-data's `serializeHasMany` to serialize oneToMany
      relationships.
    */
    serializeHasMany: function(record, json, relationship) {
      var key = relationship.key;
      var payloadKey = this.keyForRelationship ? this.keyForRelationship(key, "hasMany") : key;
      json[payloadKey] = Ember['default'].A(record.get(key)).mapBy('id');
    },

    serializeBelongsTo: function(record, json, relationship) {
      this._super(record, json, relationship);
      var key = relationship.key;
      // var payloadKey = this.keyForRelationship ? this.keyForRelationship(key, "belongsTo") : relationship.key;
      if (typeof json[key] === "undefined" || json[key] === '') {
        delete json[key];
      }
    }

  });

});
define('emberfire/utils/to-promise', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = function(fn, context, _args, errorMsg) {
    var args = _args || [];
    return new Ember['default'].RSVP.Promise(function(resolve, reject) {
      var callback = function(error) {
        if (error) {
          if (errorMsg && typeof error === 'object') {
            error.location = errorMsg;
          }
          reject(error);
        } else {
          resolve();
        }
      };
      args.push(callback);
      fn.apply(context, args);
    });
  }

});
define("simple-auth-token", ["simple-auth-token/index","exports"], function(__index__, __exports__) {
  "use strict";
  Object.keys(__index__).forEach(function(key){
    __exports__[key] = __index__[key];
  });
});

define('simple-auth-token/authenticators/token', ['exports', 'ember', 'simple-auth/authenticators/base', 'simple-auth-token/configuration'], function (exports, Ember, Base, Configuration) {

  'use strict';

  exports['default'] = Base['default'].extend({
    /**
      The endpoint on the server the authenticator acquires the auth token from.

      This value can be configured via
      [`SimpleAuth.Configuration.Token#serverTokenEndpoint`](#SimpleAuth-Configuration-Token-serverTokenEndpoint).

      @property serverTokenEndpoint
      @type String
      @default '/api-token-auth/'
    */
    serverTokenEndpoint: '/api-token-auth/',

    /**
      The attribute-name that is used for the identification field when sending the
      authentication data to the server.

      This value can be configured via
      [`SimpleAuth.Configuration.Token#identificationField`](#SimpleAuth-Configuration-Token-identificationField).

      @property identificationField
      @type String
      @default 'username'
    */
    identificationField: 'username',

    /**
      The attribute-name that is used for the password field when sending the
      authentication data to the server.

      This value can be configured via
      [`SimpleAuth.Configuration.Token#passwordfield`](#SimpleAuth-Configuration-Token-passwordfield).

      @property passwordField
      @type String
      @default 'password'
    */
    passwordField: 'password',

    /**
      The name of the property in session that contains token used for authorization.

      This value can be configured via
      [`SimpleAuth.Configuration.Token#tokenPropertyName`](#SimpleAuth-Configuration-Token-tokenPropertyName).

      @property tokenPropertyName
      @type String
      @default 'token'
    */
    tokenPropertyName: 'token',

    /**
      The property that stores custom headers that will be sent on every request.

      This value can be configured via
      [`SimpleAuth.Configuration.Token#headers`](#SimpleAuth-Configuration-Token-headers).

      @property headers
      @type Object
      @default {}
    */
    headers: {},

    /**
      @method init
      @private
    */
    init: function() {
      this.serverTokenEndpoint = Configuration['default'].serverTokenEndpoint;
      this.identificationField = Configuration['default'].identificationField;
      this.passwordField = Configuration['default'].passwordField;
      this.tokenPropertyName = Configuration['default'].tokenPropertyName;
      this.headers = Configuration['default'].headers;
    },

    /**
      Restores the session from a set of session properties; __will return a
      resolving promise when there's a non-empty `token` in the
      `properties`__ and a rejecting promise otherwise.

      @method restore
      @param {Object} properties The properties to restore the session from
      @return {Ember.RSVP.Promise} A promise that when it resolves results in the session being authenticated
    */
    restore: function(properties) {
      var _this = this,
          propertiesObject = Ember['default'].Object.create(properties);

      return new Ember['default'].RSVP.Promise(function(resolve, reject) {
        if (!Ember['default'].isEmpty(propertiesObject.get(_this.tokenPropertyName))) {
          resolve(properties);
        } else {
          reject();
        }
      });
    },

    /**
      Authenticates the session with the specified `credentials`; the credentials
      are `POST`ed to the
      [`Authenticators.Token#serverTokenEndpoint`](#SimpleAuth-Authenticators-Token-serverTokenEndpoint)
      and if they are valid the server returns an auth token in
      response. __If the credentials are valid and authentication succeeds, a
      promise that resolves with the server's response is returned__, otherwise a
      promise that rejects with the server error is returned.

      @method authenticate
      @param {Object} options The credentials to authenticate the session with
      @return {Ember.RSVP.Promise} A promise that resolves when an auth token is successfully acquired from the server and rejects otherwise
    */
    authenticate: function(credentials) {
      var _this = this;
      return new Ember['default'].RSVP.Promise(function(resolve, reject) {
        var data = _this.getAuthenticateData(credentials);
        _this.makeRequest(data).then(function(response) {
          Ember['default'].run(function() {
            resolve(_this.getResponseData(response));
          });
        }, function(xhr) {
          Ember['default'].run(function() {
            reject(xhr.responseJSON || xhr.responseText);
          });
        });
      });
    },

    /**
      Returns an object used to be sent for authentication.

      @method getAuthenticateData
      @return {object} An object with properties for authentication.
    */
    getAuthenticateData: function(credentials) {
      var authentication = {};
      authentication[this.passwordField] = credentials.password;
      authentication[this.identificationField] = credentials.identification;
      return authentication;
    },

    /**
      Returns an object with properties the `authenticate` promise will resolve,
      be saved in and accessible via the session.

      @method getResponseData
      @return {object} An object with properties for the session.
    */
    getResponseData: function(response) {
      return response;
    },

    /**
      Does nothing

      @method invalidate
      @return {Ember.RSVP.Promise} A resolving promise
    */
    invalidate: function() {
      return Ember['default'].RSVP.resolve();
    },

    /**
      @method makeRequest
      @private
    */
    makeRequest: function(data) {
      return Ember['default'].$.ajax({
        url: this.serverTokenEndpoint,
        type: 'POST',
        data: JSON.stringify(data),
        dataType: 'json',
        contentType: 'application/json',
        beforeSend: function(xhr, settings) {
          xhr.setRequestHeader('Accept', settings.accepts.json);
        },
        headers: this.headers
      });
    }
  });

});
define('simple-auth-token/authorizers/token', ['exports', 'ember', 'simple-auth/authorizers/base', 'simple-auth-token/configuration'], function (exports, Ember, Base, Configuration) {

  'use strict';

  exports['default'] = Base['default'].extend({
    /**
      The prefix used in the value of the Authorization header.

      This value can be configured via
      [`SimpleAuth.Configuration.Token#authorizationPrefix`](#SimpleAuth-Configuration-Token-authorizationPrefix).

      @property authorizationPrefix
      @type String
      @default 'Bearer '
    */
    authorizationPrefix: 'Bearer ',

    /**
      The name of the property in session that contains token used for authorization.

      This value can be configured via
      [`SimpleAuth.Configuration.Token#tokenPropertyName`](#SimpleAuth-Configuration-Token-tokenPropertyName).

      @property tokenPropertyName
      @type String
      @default 'token'
    */
    tokenPropertyName: 'token',

    /**
      The name of the HTTP Header used to send token.

      This value can be configured via
      [`SimpleAuth.Configuration.Token#authorizationHeaderName`](#SimpleAuth-Configuration-Token-authorizationHeaderName).

      @property authorizationHeaderName
      @type String
      @default 'Authorization'
    */
    authorizationHeaderName: 'Authorization',

    /**
      @method init
      @private
    */
    init: function() {
      this.tokenPropertyName = Configuration['default'].tokenPropertyName;
      this.authorizationHeaderName = Configuration['default'].authorizationHeaderName;

      if (Configuration['default'].authorizationPrefix || Configuration['default'].authorizationPrefix === null) {
        this.authorizationPrefix = Configuration['default'].authorizationPrefix;
      }
    },

    /**
      Authorizes an XHR request by sending the `token`
      properties from the session in the `Authorization` header:

      ```
      Authorization: Bearer <token>
      ```

      @method authorize
      @param {jqXHR} jqXHR The XHR request to authorize (see http://api.jquery.com/jQuery.ajax/#jqXHR)
    */
    authorize: function(jqXHR) {
      var token = this.buildToken();

      if (this.get('session.isAuthenticated') && !Ember['default'].isEmpty(token)) {
        if(this.authorizationPrefix) {
          token = this.authorizationPrefix + token;
        }

        jqXHR.setRequestHeader(this.authorizationHeaderName, token);
      }
    },

    /**
      Builds the token string. It can be overriden for inclusion of quotes.

      @method buildToken
      @return {String}
    */
    buildToken: function() {
      return this.get('session.' + this.tokenPropertyName);
    }
  });

});
define('simple-auth-token/configuration', ['exports', 'simple-auth-token/utils/load-config'], function (exports, loadConfig) {

  'use strict';

  var defaults = {
    serverTokenEndpoint: '/api-token-auth/',
    identificationField: 'username',
    passwordField: 'password',
    tokenPropertyName: 'token',
    authorizationPrefix: 'Bearer ',
    authorizationHeaderName: 'Authorization',
    headers: {}
  };

  /**
    Ember Simple Auth Token's configuration object.

    To change any of these values, set them on the application's
    environment object:

    ```js
    ENV['simple-auth-token'] = {
      serverTokenEndpoint: '/some/other/endpoint'
    }
    ```

    @class Token
    @namespace SimpleAuth.Configuration
    @module simple-auth/configuration
  */
  exports['default'] = {
    /**
      The endpoint on the server the authenticator acquires the auth token
      and email from.

      @property serverTokenEndpoint
      @readOnly
      @static
      @type String
      @default '/users/sign_in'
    */
    serverTokenEndpoint: defaults.serverTokenEndpoint,

    /**
      The attribute-name that is used for the identification field when sending
      the authentication data to the server.

      @property identificationField
      @readOnly
      @static
      @type String
      @default 'username'
    */
    identificationField: defaults.identificationField,

    /**
      The attribute-name that is used for the password field when sending
      the authentication data to the server.

      @property passwordField
      @readOnly
      @static
      @type String
      @default 'password'
    */
    passwordField: defaults.passwordField,

    /**
      The name of the property in session that contains token
      used for authorization.

      @property tokenPropertyName
      @readOnly
      @static
      @type String
      @default 'token'
    */
    tokenPropertyName: defaults.tokenPropertyName,

    /**
      The prefix used in the value of the Authorization header.

      @property authorizationPrefix
      @readOnly
      @static
      @type String
      @default 'Bearer '
    */
    authorizationPrefix: defaults.authorizationPrefix,

    /**
      The name of the HTTP Header used to send token.

      @property authorizationHeaderName
      @readOnly
      @static
      @type String
      @default 'Authorization'
    */
    authorizationHeaderName: defaults.authorizationHeaderName,

    /**
      Custom headers to be added on request.

      @property headers
      @readonly
      @static
      @type Object
      @default {}
    */
    headers: defaults.headers,

    /**
      @method load
      @private
    */
    load: loadConfig['default'](defaults)
  };

});
define('simple-auth-token/utils/get-global-config', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  var global = (typeof window !== 'undefined') ? window : {};

  exports['default'] = function(scope) {
    return Ember['default'].get(global, 'ENV.' + scope) || {};
  }

});
define('simple-auth-token/utils/load-config', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = function(defaults, callback) {
    return function(container, config) {
      var wrappedConfig = Ember['default'].Object.create(config);
      for (var property in this) {
        if (this.hasOwnProperty(property) && Ember['default'].typeOf(this[property]) !== 'function') {
          this[property] = wrappedConfig.getWithDefault(property, defaults[property]);
        }
      }
      if (callback) {
        callback.apply(this, [container, config]);
      }
    };
  }

});//# sourceMappingURL=addons.map