import DS from 'ember-data';
import ENV from 'bankroll-v1/config/environment';

export default DS.RESTAdapter.extend({
  host: 'http://localhost:26080',
  namespace: 'api',
    headers: function() {
    if ( localStorage.getItem("access_token") ) {
      return { "Authorization": "Bearer "
          + localStorage.getItem("access_token") };
    }
    return {};
  //}.property().volatile(), // ensure value not cached
}
});