<template>
    <div class="counterDetails">
      <p>
        {{$route.params.name}} {{$route.params.type}}<br />
        <input type="button" value="Request data" v-on:click="requestData" />
      </p>
      <p>
        Загрузка CSV: <input type="file" @change="onFileChange"/>
        <input type="submit" value="Отправить" v-on:click="uploadFile"/>
      </p>
      <p style="background-color: #ccc;">
        {{msg}}
      </p>
      <div class="controls" v-if="dataCharts.length">
        <p>Показать/скрыть графики</p>
        <label v-for="(graphObj,index) in dataCharts" :key="index">
          <input type="checkbox" v-model="graphObj.enabled" /> {{graphObj.groupName}}
        </label>
        <p>Кол-во графиков в строке</p>
        <p class="controls__layout">
          1: <input name="layout" type="radio" value="1" v-model="layout">
          2: <input name="layout" type="radio" value="2" v-model="layout">
          3: <input name="layout" type="radio" value="3" v-model="layout">
        </p>
      </div>
      <div v-bind:class="graphsLayoutClass">
        <div v-for="(graphObj,index) in dataCharts" :key="index">
          <div class="graphContainer" v-if="graphObj.enabled">
            <p>{{graphObj.groupName}}</p>
            <Graph v-if="graphObj.enabled" :chartData="graphObj.chartData" :options="graphObj.options"></Graph>
          </div>
        </div>
      </div>
    </div>
</template>

<script>
import axios from 'axios';
import moment from 'moment';
moment.locale('ru');

import Graph from './Graph';

export default {
  name: 'CounterDetails',
  props: ['interval', 'graphsLayout'],
  components: { Graph },
  mounted() {
    this.getData();
  },
  data() {
    return {
      msg: '',
      filesToUpload: [],
      dataCharts: [],
      layout: this.graphsLayout
    }
  },
  computed: {
    graphsLayoutClass: function() {
      return 'graphsWrapper grid-'+this.graphsLayout;
    }
  },
  watch: {
    interval: {
      handler: function(val) {
        this.getData();
      },
      deep: true
    },
    layout: {
      handler: function(val) {
        this.$emit('graphsLayoutChange', val);
      },
      deep: true
    },
    graphsLayoutClass: function(val) {
      this.getData();
    }
  },
  methods: {
    requestData: function() {
      this.msg = 'Пожалуйста, подождите...';
      axios.get(
        process.env.API_URL+"/api/get"
        +'/'+this.$route.params.name
        +'/'+this.$route.params.type
        +'/'+moment(this.interval.date1).format('YYYY-MM-DD')
        +'/'+moment(this.interval.date2).format('YYYY-MM-DD')
      )
      .then(response => {
        this.msg = '';
        this.getData();
      })
      .catch(err => {console.log(err)})
    },
    getData: function() {
      this.dataCharts = [];
      var dataCh = this.dataCharts;
      axios.get(
        process.env.API_URL+"/api/data?name="+this.$route.params.name+"&type="+this.$route.params.type
        +"&date1="+moment(this.interval.date1).format('YYYY-MM-DD')
        +'&date2='+moment(this.interval.date2).format('YYYY-MM-DD')
      )
      .then(response => {
        var resData = response.data.data;
        this.processChartsData(resData);
      })
      .catch(err => {console.log(err)})
    },
    processChartsData: function(data) {
      if(!data.data) {
        return;
      }
      var dataCh = this.dataCharts;
      var grouping = [
        {
          index: 0,
          name: 'Посещаемость',
          labels: ['Визиты - Новые посетители', 'Визиты - Вернувшиеся посетители'],
          colors: ['rgba(196, 93, 105, 1.0)', 'rgba(32, 162, 219, 1.0)'],
          bgColors: ['rgba(196, 93, 105, 0.0)', 'rgba(32, 162, 219, 0.0)']
        },
        {
          index: 1,
          name: 'Посещаемость (по источникам)',
          labels: [
            'Визиты - Переходы по рекламе', 'Визиты - Переходы с сохранённых страниц',
            'Визиты - Переходы из социальных сетей', 'Визиты - Прямые заходы',
            'Визиты - Переходы из поисковых систем', 'Визиты - Внутренние переходы',
            'Визиты - Переходы по ссылкам на сайтах'
          ],
          colors: [
            'rgba(196, 93, 105, 1.0)', 'rgba(32, 162, 219, 1.0)',
            'rgba(109, 37, 111, 1.0)', 'rgba(151, 50, 82, 1.0)',
            'rgba(99, 152, 51, 1.0)', 'rgba(170, 108, 57, 1.0)',
            'rgba(255, 252, 29, 1.0)'
            ],
          bgColors: [
            'rgba(196, 93, 105, 0.0)', 'rgba(32, 162, 219, 0.0)',
            'rgba(109, 37, 111, 0.0)', 'rgba(151, 50, 82, 0.0)',
            'rgba(99, 152, 51, 0.0)', 'rgba(170, 108, 57, 0.0)',
            'rgba(255, 252, 29, 0.0)'
            ]
        },
        {
          index: 2,
          name: 'Время на сайте',
          labels: ['Ср. время (сек) - Итого/Среднее'],
          colors: ['rgba(196, 93, 105, 1.0)'],
          bgColors: ['rgba(196, 93, 105, 0.0)']
        },
        {
          index: 3,
          name: 'Глубина просмотра',
          labels: ['Глубина просмотра - Итого/Среднее'],
          colors: ['rgba(196, 93, 105, 1.0)'],
          bgColors: ['rgba(196, 93, 105, 0.0)']
        },
        {
          index: 4,
          name: 'Заказы',
          labels: ['Заказы - Оплаченные', 'Заказы - Неоплаченные'],
          colors: ['rgba(196, 93, 105, 1.0)', 'rgba(32, 162, 219, 1.0)'],
          bgColors: ['rgba(196, 93, 105, 0.0)', 'rgba(32, 162, 219, 0.0)']
        },
        {
          index: 5,
          name: 'Суммы заказов',
          labels: ['Заказы - Сумма итого', 'Заказы - Сумма оплат'],
          colors: ['rgba(196, 93, 105, 1.0)', 'rgba(32, 162, 219, 1.0)'],
          bgColors: ['rgba(196, 93, 105, 0.0)', 'rgba(32, 162, 219, 0.0)']
        },
        {
          index: 6,
          name: 'Кол-во товара',
          labels: ['Заказы - Кол-во номенклатуры', 'Заказы - Кол-во позиций'],
          colors: ['rgba(196, 93, 105, 1.0)', 'rgba(32, 162, 219, 1.0)'],
          bgColors: ['rgba(196, 93, 105, 0.0)', 'rgba(32, 162, 219, 0.0)']
        }
      ];
      var tempDataCharts = [];
      data.data.forEach(function(graph, i, dataArray) {
        var hasGroup = grouping.filter(function(group) {
          return group.labels.includes(graph.label);
        });
        if(hasGroup.length) {
          hasGroup.forEach(function(group, j, groups) {
            var index = null;
            var tempCharts = tempDataCharts.filter(function(chart) {
              return chart.groupIndex == group.index;
            });
            if(tempCharts.length) {
              tempCharts.forEach(function(c, i, temps) {
                temps[i].chartData.datasets.push({
                  label: graph.label,
                  borderColor: group.colors[temps[i].chartData.datasets.length],
                  backgroundColor: group.bgColors[temps[i].chartData.datasets.length],
                  data: graph.data
                });
              })
            } else {
              tempDataCharts.push({
                enabled: true,
                groupName: group.name,
                groupIndex: group.index,
                chartData: {
                  labels: data.labels,
                  datasets: [
                    {
                      label: graph.label,
                      borderColor: group.colors[0],
                      backgroundColor: group.bgColors[0],
                      data: graph.data
                    }
                  ]
                },
                options: { responsive: true, maintainAspectRatio: false }
              });
            }
          });
        } else {
          dataCh.push({
            chartData: {
              enabled: true,
              labels: data.labels,
              datasets: [
                {
                  label: graph.label,
                  backgroundColor: '#9AD0F5',
                  data: graph.data
                }
              ]
            },
            options: {responsive: true, maintainAspectRatio: false}
          });
        }
      });
      tempDataCharts.forEach(function(chart, i, charts) {
        dataCh.push(chart);
      });
      dataCh.sort(function(item1, item2) {
        return item1.groupIndex > item2.groupIndex;
      });
      // Strip chart data
      var d1 = moment(this.interval.date1).startOf('day').toDate();
      var d1start = moment(d1).startOf('week').startOf('day').toDate();
      var d2 = moment(this.interval.date2).startOf('day').toDate();
      var d2end = moment(d2).endOf('week').startOf('day').toDate();

      var beginSlice = moment(d1).diff(moment(d1start), 'days');
      var endSlice = moment(d2).diff(moment(d2end), 'days');

      dataCh.forEach(function(chart, i, charts) {
        var labels = chart.chartData.labels;
        charts[i].chartData.labels = labels.slice(beginSlice, labels.length + endSlice);
        var datasets = chart.chartData.datasets;
        datasets.forEach(function(dataset, j, datasets) {
          datasets[j].data = datasets[j].data.slice(beginSlice, datasets[j].data.length + endSlice);
        });
      });

    },
    onFileChange(e) {
      var files = e.target.files || e.dataTransfer.files;
      if (!files.length)
        return;
      this.filesToUpload = [];
      Array
        .from(Array(files.length).keys())
        .map(x => {
          this.filesToUpload.push(files[x]);
        });
    },
    uploadFile() {
      this.msg = 'Пожалуйста, подождите...';
      var formData = new FormData();
      this.filesToUpload.forEach(function(file, i, files) {
        formData.append('file'+file.name, file);
      });
      axios.post(process.env.API_URL+'/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      .then(response => {
        var data = this._procResponse('uploadFile./api/upload', response);
        if(!data)
          return;
        var uploadPath = data.uploadPath;
        var postBody = {
          name: this.$route.params.name,
          type: this.$route.params.type,
          filepath: uploadPath
        };
        axios.post(process.env.API_URL+'/api/procfile', postBody)
        .then(response => {
          var data = this._procResponse('uploadFile./api/procfile', response);
          if(data) {
            this.msg = '';
            this.getData();
          }
        })
        .catch(err => {console.log(err);});
      })
      .catch(err => {console.log(err);});
    },
    toggleChart(index) {
      this.dataCharts[index].enabled = !this.dataCharts[index].enabled;
    },
    _procResponse(func, response) {
      if(response.status != 200) {
        console.log(func + ': ' + response.status);
        this.msg = func + ': ' + response.status;
        return false;
      }
      var resData = response.data;
      if(resData.status != 'OK') {
        console.log(func + ': ' + resData.msg);
        this.msg = func + ': ' + resData.msg;
        return false;
      }
      return resData.data;
    }
  }
}
</script>

<style scoped>
.graphsWrapper {
  display: grid;
  grid-template-rows: auto;
}
.grid-1 {
  grid-template-columns: 100%;
}
.grid-2 {
  grid-template-columns: 50% 50%;
}
.grid-3 {
  grid-template-columns: 33% 33% 33%;
}
.controls .controls__layout p {
  display: inline;
}
.graphContainer, .controls {
  border-top: 1px solid #ccc;
  padding: 0.2em;
}
.graphContainer {
  padding: 1em;
}
</style>