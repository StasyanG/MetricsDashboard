import Vue from 'vue'
import Router from 'vue-router'
import CounterList from '@/components/CounterList'
import CounterDetails from '@/components/CounterDetails'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Main Page',
      component: CounterList
    },
    {
      path: '/details/:name/:type',
      name: 'Counter Details',
      component: CounterDetails
    }
  ]
})
