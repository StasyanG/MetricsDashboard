<template>
  <div class="monitor">
    <aside class="sidebar">
      <router-link v-bind:to="{path: `/monitor/${website}`}"
        tag="div" class="sidebar__item" 
        v-for="(website,index) in websiteList" :key="index">{{website}}</router-link>
    </aside>
    <div class="main">
      <IntervalSelector :interval="interval" v-on:intervalChange="handleIntervalChange">
      </IntervalSelector>
      <main>
        <router-view 
          :interval="interval" 
          :graphsLayout="graphsLayout"
          v-on:graphsLayoutChange="handleGraphsLayoutChange" />
      </main>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import Auth from '@/components/Authentication';
import IntervalSelector from './IntervalSelector';

export default {
  name: 'Monitor',
  props: ['interval', 'graphsLayout', 'handleIntervalChange', 'handleGraphsLayoutChange'],
  components: { IntervalSelector },
  data () {
    return {
        websiteList: []
    }
  },
  mounted() {
    var list = this.websiteList;
    axios.get(process.env.API_URL+"/api/counters", {
      headers: {
        'Authorization': Auth.getAuthenticationHeader(this)
      }
    })
    .then(response => {
      var respData = response.data.data;
      respData.forEach(function(item, i, respData) {
        if (list.indexOf(item.name) == -1) {
          list.push(item.name);
        }
      });
    })
    .catch(err => {console.log(err)})
  }
}
</script>