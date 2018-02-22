<template>
    <div class="counterList">
        <router-link v-bind:to="{path: `/details/${result.name}/${result.type}`}"
                    tag="div" class="counterList__item" 
                    v-for="(result,index) in results" :key="index">
            <div class="counterList__item__name">
                {{result.name}}
            </div>
            <div class="counterList__item__typeid">
                {{result.type}} • {{result.id}}
            </div>
            <div class="counterList__item__table">
                ...Counter Quick Info...
            </div>
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
}
.counterList__item {
    border: 1px solid #ccc;
    cursor: pointer;
    display: grid;
    grid-template-rows: 1fr 1fr;
    grid-template-columns: 1fr 5fr;
    grid-template-areas: 
    "counter_name counter_table"
    "counter_typeid counter_table";
    padding: 10px;
    margin: 10px 0 10px 0;
}
.counterList__item__name {
    grid-area: counter_name
}
.counterList__item__typeid {
    color: #888;
    grid-area: counter_typeid
}
.counterList__item__table {
    grid-area: counter_table
}
</style>