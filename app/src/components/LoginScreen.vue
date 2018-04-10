<template>
  <div class="loginScreen">
    <div class="loginScreen__container">
      <div class="loginScreen__container__title">
          Metrics Dashboard
      </div>
      <div class="loginScreen__container__form">
        <form v-on:submit.prevent="authenticate">
          <label>Логин / e-mail</label>
          <input v-model="auth.username" type="text" placeholder="Логин / e-mail"/>
          <label>Пароль</label>
          <input v-model="auth.password" type="password" placeholder="Пароль"/>
          <button type="submit" value="Войти">Войти</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
/* Auth Code Source: https://gist.github.com/hfalucas/60cb40c62e2e13e6c797f4887e43c8f6 */
export default {
  name: 'LoginScreen',
  data () {
    return {
      auth: { username: '', password: '' },
      user: {},
    }
  },
  methods: {
    authenticate() {
      let credentials = this.auth;
      this.$http.post(process.env.API_URL+'/auth/login', credentials).then((response) => {
        /**
         * Now that we successfully retrieved the token and the user information
         * we have a couple of options:
         * 
         *     1) Save the token in local storage 
         *         - Keeps the token saved even when the browser is closed
         *     2) Save the token in session storage
         *         - Deletes the token when user closes the browser or even the tab
         *     3) Save the token in a cookie
         *
         *  Both local and session storage api are the same so I'll use the local storage 
         *  for the sake of the example
         *  
         */
        console.log('Auth status:' + response.status);
        window.localStorage.setItem('token', response.data.token)
        window.localStorage.setItem('auth-user', JSON.stringify(response.data.user))
        
        this.$route.router.push({name: 'Monitor'})
      }).catch((errors) => {
        // catch errors
      })
    }
  }
}
</script>