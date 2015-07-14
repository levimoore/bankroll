import Ember from 'ember';
import AunthenticatedRoute from './authenticated';

var SoccerRoute = AunthenticatedRoute.extend({
  model: function() {
    return this.store.find('contact');
  }
});

export default SoccerRoute;