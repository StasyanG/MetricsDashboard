<template>
  <div class="adminView">
    <button class="btn" v-on:click="() => {this.dialogAddAccount.active = true;}">
      Добавить аккаунт
    </button>
    <table class="accountList" v-if="accounts.length > 0">
      <tr>
        <th>Провайдер</th>
        <th>Имя пользователя</th>
        <th>Метод авторизации</th>
        <th>Авторизован</th>
        <th></th>
      </tr>
      <tr className="accountList__item" v-for="(account, index) in accounts" :key="index">
        <td>{{account.provider}}</td>
        <td>{{account.username}}</td>
        <td>{{account.authMethod}}</td>
        <td>{{account.authenticated ? 'Да' : 'Нет'}}</td>
        <td>
          <a href="#" v-on:click="() => requestAccess(account)">
            <b>Авторизовать</b>
          </a>
        </td>
      </tr>
    </table>
    <div class="dialogOverlay" v-if="!!authProcess.active">
      <div class="dialog">
        <span class="close" v-on:click="endAuthProcess">X</span>
        <form v-on:submit.prevent="submitAuthForm">
          <label>Введите код:</label>
          <input type="text" v-model="authProcess.code" />
          <button type="submit" value="Authorize">Авторизовать</button>
        </form>
      </div>
    </div>
    <div class="dialogOverlay" v-if="!!dialogAddAccount.active">
      <div class="dialog">
        <span class="close" v-on:click="closeDialogAddAccount">X</span>
        <form v-on:submit.prevent="submitAddAccountForm">
          <div>
            <label>Выберите провайдера:</label>
            <select v-model="dialogAddAccount.provider">
              <option
                v-for="(provider, index) in providers" :key="index"
                :value="provider">
                {{provider.name}}
              </option>
            </select>
          </div>
          <div v-if="dialogAddAccount.provider">
            <label>Выберите метод авторизации:</label>
            <select v-model="dialogAddAccount.authMethod">
              <option
                v-for="(method, index) in dialogAddAccount.provider.authMethods" :key="index"
                :value="method">
                {{method}}
              </option>
            </select>
          </div>
          <div v-if="dialogAddAccount.provider">
            <label>Введите имя пользователя (у провайдера):</label>
            <input type="text" v-model="dialogAddAccount.username" />
          </div>
          <button type="submit" value="Authorize">Добавить аккаунт</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import Auth from '@/components/Authentication';

export default {
  name: 'Admin',
  data () {
    return {
      accounts: [],
      providers: [],
      authProcess: {
        active: false,
        account: null,
        code: ''
      },
      dialogAddAccount: {
        active: false,
        provider: null,
        authMethod: null,
        username: '',
      }
    }
  },
  async mounted() {
    const resAccounts = await Auth.request(this, 'get', `${process.env.API_URL}/api/accounts`);
    this.accounts = resAccounts.data.map(account => ({
      ...account,
      authenticated: account.authMethod === 'oauth' && account.oauthAccessToken
        || account.authMethod === 'apikey' && account.apiKey
    }));
    const resProviders = await Auth.request(this, 'get', `${process.env.API_URL}/api/providers`);
    this.providers = resProviders.data;
  },
  methods: {
    requestAccess(account) {
      alert('* Сейчас откроется страница провайдера. Войдите в аккаунт на сайте провайдера.\n'
        + '* Если вы уже вошли, то проверьте, тот ли это аккаунт, который вы авторизуете'
        + ' (по имени пользователя). Если всё правильно, то авторизуйте приложение (разрешите доступ).\n'
        + '* Скопируйте код и введите его на этой странице в соответствующем поле.\n'
        + '* После этого можно перейти в Монитор и добавить счетчики.');
      this.authProcess = {
        ...this.authProcess,
        active: true,
        account: account
      }
      const uri = `${process.env.API_URL}/auth/${account.provider.toLowerCase()}/request`;
      window.open(uri);
    },
    submitAuthForm() {
      const code = this.authProcess.code;
      const account = this.authProcess.account;

      const uri = `${process.env.API_URL}/auth/${account.provider.toLowerCase()}/authorize`;
      Auth.request(this, 'post', uri, {
        code: code,
        accountId: account._id
      })
        .then(response => {
          const index = this.accounts.findIndex(acc => acc._id == account._id);
          this.accounts[index] = {
            ...response.data.account,
            authenticated: true
          };
          this.endAuthProcess();
        })
        .catch(err => console.log(err));
    },
    endAuthProcess() {
      this.authProcess = {
        active: false,
        account: null,
        code: ''
      }
    },
    submitAddAccountForm() {
      const username = this.dialogAddAccount.username;
      const provider = this.dialogAddAccount.provider.name;
      const authMethod = this.dialogAddAccount.authMethod;

      const uri = `${process.env.API_URL}/api/accounts`;
      Auth.request(this, 'post', uri, {
        username,
        provider,
        authMethod
      })
        .then(response => {
          this.accounts.push(response.data);
          this.closeDialogAddAccount();
        })
        .catch(err => console.log(err));
    },
    closeDialogAddAccount() {
      this.dialogAddAccount = {
        ...this.dialogAddAccount,
        active: false
      }
    }
  }
}
</script>