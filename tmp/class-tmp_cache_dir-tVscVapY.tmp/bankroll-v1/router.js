define('bankroll-v1/router', ['exports', 'ember', 'bankroll-v1/config/environment'], function (exports, Ember, config) {

  'use strict';

  var Router = Ember['default'].Router.extend({
    location: config['default'].locationType
  });

  Router.map(function() {
    this.route('user');
    this.route('leagues');
    this.route('wagers');
    this.route('account');
    this.route('login');
    this.route('logout');
    this.route('bankroll');
    this.route('football');
    this.route('basketball');
    this.route('baseball');
    this.route('soccer');
    this.route('hockey');
    this.route('password');
    this.route('authenticated');
    this.route('email');
    this.route('signup');
    this.route('leagues/new');
    this.resource('league', { path: '/league/:league_id' });
  });

  exports['default'] = Router;

});