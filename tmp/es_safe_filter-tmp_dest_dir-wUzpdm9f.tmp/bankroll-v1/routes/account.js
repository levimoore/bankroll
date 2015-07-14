import Ember from 'ember';
import AunthenticatedRoute from './authenticated';

var AccountRoute = AunthenticatedRoute.extend({
  model: function() {
    return this.store.find('user');
  }
});

export default AccountRoute;