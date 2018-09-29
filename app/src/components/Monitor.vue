<template>
  <div class="monitor">
    <aside class="sidebar">
      <div class="sidebar__item" v-on:click="openDialog">
        <small>&plus; Добавить счетчик</small>
      </div>
      <router-link v-bind:to="{path: `/monitor/${metrics._id}`}"
        tag="div" class="sidebar__item" 
        v-for="(metrics, index) in metricsList" :key="index">
        {{metrics.name}}<br />
        <small>{{metrics.username}} ({{metrics.provider}})</small>
      </router-link>
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
    <div class="dialogOverlay" v-if="dialog.open">
      <div class="dialog">
        <span class="close" v-on:click="closeDialog">X</span>
        <form v-on:submit.prevent="addMetrics">
          <label>Выберите аккаунт:</label>
          <select v-model="dialog.selectedAccount"
            v-on:change="e => this.getCounters(e.target.value)">
            <option
              v-for="(account, index) in accounts" :key="index"
              :value="account._id">
              {{account.username}} ({{account.provider}})
            </option>
          </select>
          <div v-if="dialog.selectedAccount && dialog.counters.length > 0">
            <label>Выберите счетчик:</label>
            <select v-model="dialog.selectedCounter">
              <option
                v-for="(counter, index) in dialog.counters" :key="index"
                :value="counter.id" :disabled="counter._disabled || !counter._status">
                {{counter.name}}&nbsp;{{counter._status ? '' : '(не работает)'}}
              </option>
            </select>
          </div>
          <div v-if="dialog.selectedAccount && dialog.selectedCounter">
            <label>Выберите частоту обновления:</label>
            <select v-model="dialog.updateFreq">
              <option value="1d">Каждый день</option>
              <option value="2d">Через день</option>
              <option value="7d">Каждую неделю</option>
            </select>
          </div>
          <button type="submit" value="Добавить"
            v-if="dialog.selectedAccount && dialog.selectedCounter">
            Добавить
          </button>
        </form>
      </div>
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
      accounts: [],
      metricsList: [],
      dialog: {
        open: false,
        counters: [],
        selectedAccount: null,
        selectedCounter: null,
        updateFreq: '1d'
      },
    }
  },
  async mounted() {
    try {
      const resAccounts = await Auth.request(this, 'get', `${process.env.API_URL}/api/accounts`);
      const resMetrics = await Auth.request(this, 'get', `${process.env.API_URL}/api/metrics`);
      this.accounts = resAccounts.data;
      this.metricsList = resMetrics.data.map(metrics => {
        const account = this.accounts.find(account => account._id === metrics.accountId);
        return {
          ...metrics,
          accountId: account._id,
          provider: account.provider,
          username: account.username
        }
      });
    } catch (err) {
      console.log(err);
    }
  },
  methods: {
    openDialog() {
      this.dialog.open = true;
    },
    closeDialog() {
      this.dialog.open = false;
    },
    async getCounters(accountId) {
      try {
        const resCounters = await Auth.request(this, 'get',
          `${process.env.API_URL}/api/accounts/${accountId}/counters`);
        const account = this.accounts.find(acc => acc._id == accountId);
        this.dialog.counters = resCounters.data.counters
          .filter(counter => !!counter.name)
          .map(counter => {
            const alreadyInList = this.metricsList.findIndex(metrics =>
              metrics.accountId == accountId && metrics.id == counter.id) > -1;
            return {
              ...counter,
              _disabled: alreadyInList,
              _status: counter.code_status === 'CS_OK' ? true : false
            };
          })
      } catch (err) {
        console.log(err);
      }
    },
    async addMetrics() {
      try {
        const index = this.dialog.counters.findIndex(c =>
          c.id == this.dialog.selectedCounter);
        const counter = this.dialog.counters[index];

        const resAdd = await Auth.request(this, 'post',
          `${process.env.API_URL}/api/metrics`, {
            accountId: this.dialog.selectedAccount,
            id: counter.id,
            name: counter.name || counter.id,
            updateFreq: this.dialog.updateFreq
          });
        
        const insertedMetrics = resAdd.data;
        const account = this.accounts.find(acc =>
          acc._id == this.dialog.selectedAccount);
        this.metricsList.push({
          ...insertedMetrics,
          provider: account.provider,
          username: account.username
        });

        this.dialog.selectedCounter = null;
        this.dialog.counters.splice(index, 1);
        this.closeDialog();
      } catch (err) {
        console.log(err);
      }
    }
  }
}
</script>