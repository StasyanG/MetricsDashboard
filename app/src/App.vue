<template>
  <div id="app">
    <h1>Metrics Dashboard</h1>
    <Navigation></Navigation>
    <IntervalSelector v-on:intervalChange="handleIntervalChange" :interval="interval"></IntervalSelector>
    <router-view :interval="interval" 
                 :graphsLayout="graphsLayout" 
                 v-on:graphsLayoutChange="handleGraphsLayoutChange"/>
  </div>
</template>

<script>
import Navigation from './components/Navigation';
import IntervalSelector from './components/IntervalSelector';

import moment from 'moment';
moment.locale('ru');

export default {
  name: 'App',
  components: { Navigation, IntervalSelector },
  data() {
    return {
      interval: {
        date1: moment().subtract(7, "days").format('YYYY-MM-DD'),
        date2: moment().format('YYYY-MM-DD')
      },
      graphsLayout: '1'
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
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
