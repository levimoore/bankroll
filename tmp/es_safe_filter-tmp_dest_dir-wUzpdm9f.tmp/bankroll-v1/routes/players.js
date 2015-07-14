import Ember from 'ember';

export default Ember.Route.extend({
	model: function() {
		this.modelFor('nflteam').get('players');
	}
});
