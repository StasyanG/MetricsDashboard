// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import VueCookie from 'vue-cookie'

import App from './App'
import router from './router'
import Auth from '@/components/Authentication'

Vue.use(VueCookie)
Vue.config.productionTip = false;
Auth.checkAuthentication();

/* eslint-disable no-new */
var vue = new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
