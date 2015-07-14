import Ember from 'ember';
import DS from 'ember-data';

export default Ember.Controller.extend({
	 actions: {
    save: function() {
      var leagueName = this.get('leagueName');
      var description = this.get('description');
      var leagues = this.store.find('league');
      var _this = this;

      Ember.$.ajax('http://localhost:26080/api/leagues/new', {
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        data: JSON.stringify({leagueName: leagueName, description: description}),
      }); 
        _this.transitionToRoute('leagues').then(function(){location.reload(true)});
  }
}
});
