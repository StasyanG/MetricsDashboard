<template>
  <div class="counterDetails">
    <div class="counterDetails__info">
      <div class="counterDetails__info__name">
        {{$route.params.sitename}}
      </div>
      <div class="counterDetails__info__controls">
        <div class="counterDetails__info__controls__control">
          <input type="button" value="Запрос данных" v-on:click="requestData" />
        </div>
        <div class="counterDetails__info__controls__control">
          Загрузка CSV: <input type="file" @change="onFileChange"/>
          <input type="submit" value="Отправить" v-on:click="uploadFile"/>
        </div>
      </div>
    </div>
    <p style="background-color: #ccc;">
      {{msg}}
    </p>
    <div class="controls" v-if="dataCharts.length">
      <div class="controls__graphSelect">
        <div class="selectBox" v-on:click="showGraphSelBox">
          <select>
            <option>Показать/скрыть графики</option>
          </select>
          <div class="overSelect"></div>
        </div>
        <div id="graphCheckboxes" v-bind:style="'display: ' + (isGraphSelBoxShown ? 'block' : 'none')">
          <label v-for="(graphObj,index) in dataCharts" :key="index">
            <input type="checkbox" v-model="graphObj.enabled" />{{graphObj.groupName}}
          </label>
        </div>
      </div>
      <div class="controls__layout">
        <input name="layout" type="radio" value="1" v-model="layout" />
        <input name="layout" type="radio" value="2" v-model="layout" />
        <input name="layout" type="radio" value="3" v-model="layout" />
      </div>
    </div>
    <div v-bind:class="graphsLayoutClass">
      <div v-for="(graphObj,index) in dataChartsEnabled" :key="index" class="graphContainer">
        <p>{{graphObj.groupName}}</p>
        <Graph v-if="graphObj.enabled" :chartData="graphObj.chartData" :options="graphObj.options"></Graph>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import moment from 'moment';
moment.locale('ru');

import Auth from '@/components/Authentication';
import Graph from './Graph';

export default {
  name: 'WebsiteView',
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
      layout: this.graphsLayout,
      isGraphSelBoxShown: false
    }
  },
  computed: {
    graphsLayoutClass: function() {
      return 'graphsWrapper grid-'+this.graphsLayout;
    },
    dataChartsEnabled: function() {
      return this.dataCharts.filter(function(graphObj) {
        return graphObj.enabled;
      })
    }
  },
  watch: {
    '$route.params.id': function (id) {
      this.getData();
    },
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
      this.msg = 'Запрашиваю данные...';
      Auth.request(this, 'get',
        process.env.API_URL+"/api/get"
          +'/'+moment(this.interval.date1).format('YYYY-MM-DD')
          +'/'+moment(this.interval.date2).format('YYYY-MM-DD')
          +'/'+this.$route.params.id)
        .then(response => {
          this.msg = '';
          this.getData();
        })
        .catch(err => {console.log(err)})
    },
    getData: function() {
      this.msg = 'Загружаю данные...';
      this.dataCharts = [];
      var dataCh = this.dataCharts;
      Auth.request(this, 'get',
        process.env.API_URL+"/api/data?id="+this.$route.params.id
          +"&date1="+moment(this.interval.date1).format('YYYY-MM-DD')
          +'&date2='+moment(this.interval.date2).format('YYYY-MM-DD')
          +'&gran='+this.interval.granularity)
        .then(response => {
          this.msg = '';
          var resData = response.data;
          this.processChartsData(resData);
        })
        .catch(err => {console.log(err)})
    },
    processChartsData: function(data) {
      this.msg = 'Загружаю графики...';

      if(!data.data || data.data.length == 0) {
        this.msg = 'Нет данных';
        return;
      }
      var dataCh = this.dataCharts;
      var transparent = 'rgba(255, 255, 255, 0.0)';
      var grouping = [
        {
          index: 0,
          name: '[LI] Посещаемость',
          labels: ['[LI] Просмотры', '[LI] Посетители'],
          colors: ['rgba(0, 63, 92, 1)', 'rgba(255, 166, 0, 1)'],
          bgColors: [transparent, transparent]
        },
        {
          index: 1,
          name: '[YM] Посещаемость',
          labels: ['Визиты - Новые посетители', 'Визиты - Вернувшиеся посетители'],
          colors: ['rgba(0, 63, 92, 1)', 'rgba(255, 166, 0, 1)'],
          bgColors: [transparent, transparent]
        },
        {
          index: 2,
          name: '[YM] Посещаемость (по источникам)',
          labels: [
            'Визиты - Переходы по рекламе', 'Визиты - Переходы с сохранённых страниц',
            'Визиты - Переходы из социальных сетей', 'Визиты - Прямые заходы',
            'Визиты - Переходы из поисковых систем', 'Визиты - Внутренние переходы',
            'Визиты - Переходы по ссылкам на сайтах'
          ],
          colors: [
            'rgba(0, 63, 92, 1)', 'rgba(255, 166, 0, 1)',
            'rgba(47, 75, 124, 1)', 'rgba(255, 124, 67, 1)',
            'rgba(102, 81, 145, 1)', 'rgba(249, 93, 106, 1)',
            'rgba(160, 81, 149, 1)'
            ],
          bgColors: [
            transparent, transparent,
            transparent, transparent,
            transparent, transparent,
            transparent
            ]
        },
        {
          index: 3,
          name: '[YM] Время на сайте',
          labels: ['Ср. время (сек) - Итого/Среднее'],
          colors: ['rgba(255, 166, 0, 1)'],
          bgColors: [transparent]
        },
        {
          index: 4,
          name: '[YM] Глубина просмотра',
          labels: ['Глубина просмотра - Итого/Среднее'],
          colors: ['rgba(255, 166, 0, 1)'],
          bgColors: [transparent]
        },
        {
          index: 5,
          name: 'Заказы',
          labels: ['Заказы - Оплаченные', 'Заказы - Неоплаченные'],
          colors: ['rgba(0, 63, 92, 1)', 'rgba(255, 166, 0, 1)'],
          bgColors: [transparent, transparent]
        },
        {
          index: 6,
          name: 'Суммы заказов',
          labels: ['Заказы - Сумма итого', 'Заказы - Сумма оплат'],
          colors: ['rgba(0, 63, 92, 1)', 'rgba(255, 166, 0, 1)'],
          bgColors: [transparent, transparent]
        },
        {
          index: 7,
          name: 'Кол-во товара',
          labels: ['Заказы - Кол-во номенклатуры', 'Заказы - Кол-во позиций'],
          colors: ['rgba(0, 63, 92, 1)', 'rgba(255, 166, 0, 1)'],
          bgColors: [transparent, transparent]
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
                options: { responsive: true, maintainAspectRatio: false, animation: false }
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
            options: { responsive: true, maintainAspectRatio: false, animation: false }
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

      var beginSlice = 0;
      var endSlice = 0;
      if(this.interval.granularity == 'days') {
        var beginSlice = moment(d1).diff(moment(d1start), 'days');
        var endSlice = moment(d2).diff(moment(d2end), 'days');
      }

      dataCh.forEach(function(chart, i, charts) {
        var labels = chart.chartData.labels;
        charts[i].chartData.labels = labels.slice(beginSlice, labels.length + endSlice);
        var datasets = chart.chartData.datasets;
        datasets.forEach(function(dataset, j, datasets) {
          datasets[j].data = datasets[j].data.slice(beginSlice, datasets[j].data.length + endSlice);
        });
      });

      this.msg='';
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
    showGraphSelBox() {
      this.isGraphSelBoxShown = !this.isGraphSelBoxShown;
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
.counterDetails__info {
  border: 1px solid #ccc;
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: 150px 1fr;
  grid-template-areas: "counter_name counter_controls";
  padding: 10px;
}
.counterDetails__info__name {
  align-self: center;
  font-weight: bold;
  grid-area: counter_name;
}
.counterDetails__info__controls {
  align-self: center;
  grid-area: counter_controls;
}
.counterDetails__info__controls__control {
  border: 1px solid #ccc;
  display: inline-block;
  padding: 5px;
  margin-left: 5px;
  margin-right: 5px;
}


.graphsWrapper {
  display: grid;
  grid-template-rows: auto;
}
.grid-1 {
  grid-template-columns: 1fr;
}
.grid-2 {
  grid-template-columns: 1fr 1fr;
}
.grid-3 {
  grid-template-columns: 1fr 1fr 1fr;
}
.graphContainer, .controls {
  padding: 0.2em;
}
.graphContainer {
  border-top: 1px solid #ccc;
  min-width: 0;
  padding: 1em;
  text-align: center;
}

.controls {
  text-align: right;
}
.controls__layout {
  display: inline-block;
}
.controls__layout input[type=radio] {
  visibility: hidden;
}
.controls__layout input[type=radio]::before {
  cursor: pointer;
  visibility: visible;

  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  display: inline-block;
  font-style: normal;
  font-variant: normal;
  text-rendering: auto;
  line-height: 1;
}
.controls__layout input[type=radio][value="1"]::before{
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  content: "\F0C8";
}
.controls__layout input[type=radio][value="2"]::before{
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  content: "\F009";
}
.controls__layout input[type=radio][value="3"]::before{
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  content: "\F00A";
}

.controls__graphSelect {
  display: inline-block;
  position: relative;
  width: 300px;
}
.controls__graphSelect .selectBox {
  position: relative;
}
.controls__graphSelect .selectBox select {
  width: 100%;
  font-weight: bold;
}
.controls__graphSelect .selectBox .overSelect {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}
#graphCheckboxes {
  display: none;
  background-color: #fff;
  border: 1px #dadada solid;
  position: absolute;
  text-align: left;
  width: 298px;
}
#graphCheckboxes label {
  display: block;
}
#graphCheckboxes label:hover {
  background-color: #ccc;
}
</style>