import DS from 'ember-data';

export default DS.Model.extend({
  leagueName: DS.attr('string'),
  description: DS.attr('string'),
  member: DS.attr('string')
});
