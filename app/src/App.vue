<template>
  <div id="app">
    <header class="header">
      <div class="header__sitename">
        Metrics Dashboard
      </div>
      <div class="header__menu">
        <ul>
          <router-link v-bind:to="{path: `/monitor`}" tag="li">
            Мониторинг
          </router-link>
          <router-link v-bind:to="{path: `/admin`}" tag="li">
            Администрирование
          </router-link>
          <router-link v-bind:to="{path: `/help`}" tag="li">
            Поддержка
          </router-link>
        </ul>
      </div>
      <div class="header__user">
        Имя Фамилия&nbsp;&nbsp;&nbsp;<a class="header__user__btnlogout" href="">Выйти</a>
      </div>
    </header>
    <router-view 
      :interval="interval" 
      :graphsLayout="graphsLayout" 
      :handleIntervalChange="handleIntervalChange"
      :handleGraphsLayoutChange="handleGraphsLayoutChange"/>
  </div>
</template>

<script>
import IntervalSelector from './components/IntervalSelector';

import moment from 'moment';
moment.locale('ru');

export default {
  name: 'App',
  components: { IntervalSelector },
  data() {
    return {
      interval: {
        date1: moment().subtract(7, "days").format('YYYY-MM-DD'),
        date2: moment().format('YYYY-MM-DD'),
        granularity: 'days'
      },
      graphsLayout: '1'
    }
  },
  computed: {
    isLoggedIn: function() {
      return window.localStorage.getItem('token') ? true : false;
    }
  },
  methods: {
    handleIntervalChange: function(e) {
      this.interval = e;
    },
    handleGraphsLayoutChange: function(e) {
      this.graphsLayout = e;
    }
  }
}
</script>

<style>
@import './assets/css/style.css';
@import './assets/css/fontawesome-all.css';
</style>
