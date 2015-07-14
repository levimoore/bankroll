import DS from 'ember-data';

export default DS.Model.extend({
  bday: DS.attr('string'),
  firstName: DS.attr('string'),
  lastName: DS.attr('string'),
  zodiac: DS.attr('string')
});
