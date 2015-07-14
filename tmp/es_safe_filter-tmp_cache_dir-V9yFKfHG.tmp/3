import Ember from 'ember';

export default Ember.ObjectController.extend({
  actions: {
    join: function() {
   	var league_id = this.get('id');
    var user = this.get('user');
    var member = this.get('member');
    Ember.$.ajax('http://localhost:26080/api/leagues/join/'+league_id, {
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        data: JSON.stringify({user: user}),
      });
        this.transitionToRoute('leagues');
  }
},
    personIsMember: function() {
      return this.get('member') != 1917859;
    }.property('member')

});