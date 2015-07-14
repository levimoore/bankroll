import DS from 'ember-data';

export default DS.Model.extend({
	firstName: DS.attr('string'),
	lastName: DS.attr('string'),
	number: DS.attr('number'),
	pos: DS.attr('string'),
	height: DS.attr('string'),
	weight: DS.attr('string'),
	age: DS.attr('number'),
	college: DS.attr('string'),
	squad: DS.attr('string'),
	team: DS.attr("string"),
	nflteam: DS.belongsTo('nflteam')  
});