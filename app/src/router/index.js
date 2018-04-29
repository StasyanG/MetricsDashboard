/* Auth Code Source: https://gist.github.com/hfalucas/60cb40c62e2e13e6c797f4887e43c8f6 */
/* Modified by StasyanG (2018-04-09) */

import Vue from 'vue'
import Router from 'vue-router'
import Resource from 'vue-resource'
import Auth from '@/components/Authentication'
import AuthScreen from '@/components/Authentication/AuthScreen'
import Monitor from '@/components/Monitor'
import Admin from '@/components/Admin'
import HelpCenter from '@/components/HelpCenter'
import WebsiteView from '@/components/WebsiteView'

Vue.use(Router)
Vue.use(Resource)

const router = new Router({
  mode: 'history',
  routes: [
    { path: '/', redirect: '/monitor' },
    {
      path: '/auth',
      name: 'AuthScreen',
      component: AuthScreen
    },
    {
      path: '/monitor',
      name: 'Monitor',
      component: Monitor,
      meta: {
        linkText: 'Мониторинг',
        requiredAuth: true
      },
      children: [
        {
          path: ':sitename',
          name: 'WebsiteView',
          component: WebsiteView,
          meta: {
            linkText: 'Показатели сайта',
            requiredAuth: true
          }
        }
      ]
    },
    {
      path: '/admin',
      name: 'Admin',
      component: Admin,
      meta: { 
        linkText: 'Администрирование',
        requiredAuth: true
      }
    },
    {
      path: '/help',
      name: 'HelpCenter',
      component: HelpCenter,
      meta: {
        linkText: 'Поддержка',
        requiredAuth: true
      }
    }
  ]
});

router.beforeEach((to, from, next) => {
  if (to.meta.requiredAuth) {
    if (Auth.user.authenticated) {
      next()
    } else {
      router.push('/auth')
    }
  } else {
    next()
  }
})

export default router;
