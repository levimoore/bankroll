import Ember from 'ember';

export default Ember.Controller.extend({
  isNfcSouth: function() {
  return this.get('model').filterBy('conf', 'NFC South');
}.property('model.@each'),
	isNfcNorth: function() {
		return this.get('model').filterBy('conf', 'NFC North');
	}.property('model.@each'),
	isNfcEast: function() {
		return this.get('model').filterBy('conf', 'NFC East');
	}.property('model.@each'),
	isNfcWest: function() {
		return this.get('model').filterBy('conf', 'NFC West');
	}.property('model.@each'),
  isAfcSouth: function() {
  return this.get('model').filterBy('conf', 'AFC South');
}.property('model.@each'),
	isAfcNorth: function() {
		return this.get('model').filterBy('conf', 'AFC North');
	}.property('model.@each'),
	isAfcEast: function() {
		return this.get('model').filterBy('conf', 'AFC East');
	}.property('model.@each'),
	isAfcWest: function() {
		return this.get('model').filterBy('conf', 'AFC West');
	}.property('model.@each')
});