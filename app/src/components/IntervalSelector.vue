<template>
    <div class="intervalSelector">
        <label for="intervalSelector__interval">Интервал: </label>
        <div class="intervalSelector__datepick">
            <datepicker :format="format" v-model="interval.date1" id="datepicker1" placeholder="Начало интервала"></datepicker>
        </div>
        <div class="intervalSelector__datepick">
            <datepicker :format="format" v-model="interval.date2" id="datepicker2" placeholder="Конец интервала"></datepicker>
        </div>
        <div class="intervalSelector__granularity">
            <select v-model="interval.granularity">
                <option value="days">Дни</option>
                <option value="weeks">Недели</option>
            </select>
        </div>
    </div>
</template>

<script>
import Datepicker from 'vuejs-datepicker';
import axios from 'axios';
import moment from 'moment';
moment.locale('ru');

export default {
  name: 'IntervalSelector',
  components: { Datepicker },
  props: ["interval"],
  data() {
    return {
      format: "yyyy-MM-dd"
    }
  },
  watch: {
    interval: {
        handler: function(val) {
            this.$emit('intervalChange', val);
        },
        deep: true
    }
  }
}
</script>

<style scoped>
.intervalSelector {
    border: 1px solid #ccc;
    padding: 14px 20px;
}
.intervalSelector__datepick {
    display: inline-block;
    padding: 10px;
}
.intervalSelector__btnGetData {
    display: inline-block;
}
.intervalSelector__granularity {
    display: inline-block;
}
</style>