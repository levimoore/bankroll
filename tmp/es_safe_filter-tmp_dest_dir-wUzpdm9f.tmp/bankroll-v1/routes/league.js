import Ember from 'ember';
import DS from 'ember-data';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';


export default Ember.Route.extend(AuthenticatedRouteMixin,{
	  model: function(params){
    return this.store.find('league', params.league_id);
  }
});