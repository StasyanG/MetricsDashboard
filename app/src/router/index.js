/* Auth Code Source: https://gist.github.com/hfalucas/60cb40c62e2e13e6c797f4887e43c8f6 */
/* Modified by StasyanG (2018-04-09) */

import Vue from 'vue'
import Router from 'vue-router'
import Resource from 'vue-resource'
import LoginScreen from '@/components/LoginScreen.vue'
import Monitor from '@/components/Monitor'
import Admin from '@/components/Admin'
import HelpCenter from '@/components/HelpCenter'
import WebsiteView from '@/components/WebsiteView'

Vue.use(Router)
Vue.use(Resource)

export default new Router({
  mode: 'history',
  routes: [
    { path: '/', redirect: '/monitor' },
    {
      path: '/login',
      name: 'LoginScreen',
      component: LoginScreen
    },
    {
      path: '/monitor',
      name: 'Monitor',
      component: Monitor,
      meta: {
        access: {
          requiresLogin: true,
          requiredPermissions: ['admin', 'editor', 'viewer'],
          permissionType: 'AtLeastOne' // options: AtLeastOne, CombinationRequired
        },
        linkText: 'Мониторинг'
      },
      children: [
        {
          path: ':sitename',
          name: 'WebsiteView',
          component: WebsiteView,
          meta: { linkText: 'Показатели сайта' }
        }
      ]
    },
    {
      path: '/admin',
      name: 'Admin',
      component: Admin,
      meta: {
        access: {
          requiresLogin: true,
          requiredPermissions: ['admin'],
          permissionType: 'AtLeastOne' // options: AtLeastOne, CombinationRequired
        },
        linkText: 'Администрирование'
      }
    },
    {
      path: '/help',
      name: 'HelpCenter',
      component: HelpCenter,
      meta: {
        access: {
          requiresLogin: true,
          requiredPermissions: ['admin', 'editor', 'viewer'],
          permissionType: 'AtLeastOne' // options: AtLeastOne, CombinationRequired
        },
        linkText: 'Поддержка'
      }
    }
  ]
})
