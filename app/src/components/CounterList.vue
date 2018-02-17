<template>
    <div class="counterList">
        <router-link v-bind:to="{path: `/details/${result.name}/${result.type}`}"
                    tag="div" class="counterList__item" 
                    v-for="(result,index) in results" :key="index">
            {{result.name}} | {{result.type}} | {{result.id}}
        </router-link>
    </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'CounterList',
  data () {
    return {
        results: []
    }
  },
  mounted() {
    axios.get(process.env.API_URL+"/api/counters")
    .then(response => {this.results = response.data.data})
    .catch(err => {console.log(err)})
  }
}
</script>

<style scoped>
.counterList {
    padding: 10px;
    text-align: center;
}
.counterList__item {
    border: 1px solid #ccc;
    cursor: pointer;
    display: inline-block;
    max-width: 300px;
    padding: 10px;
    margin: 10px;
}
</style>