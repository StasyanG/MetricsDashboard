<template>
  <div class="authScreen">
    <div class="authScreen__container">
      <div class="authScreen__container__title">
        Metrics Dashboard
      </div>
      <div class="authScreen__container__snackbar" v-if="snackbar">
        {{ message }}
      </div>
      <div class="authScreen__container__form" v-if="!signUpVisible">
        <h2>Авторизация</h2>
        <form v-on:submit.prevent="submitAuthentication">
          <label>Логин</label>
          <input v-model="credentials.username" type="text" placeholder="Логин"/>
          <label>Пароль</label>
          <input v-model="credentials.password" type="password" placeholder="Пароль"/>
          <button type="submit" value="Войти">Войти</button>
        </form>
      </div>
      <div class="authScreen__container__form" v-if="signUpVisible">
        <h2>Регистрация</h2>
        <form v-on:submit.prevent="submitSignUp">
          <label>Логин</label>
          <input v-model="newUser.username" type="text" placeholder="Логин"/>
          <label>Пароль</label>
          <input v-model="newUser.password" type="password" placeholder="Пароль"/>
          <button type="submit" value="Войти">Зарегистрироваться</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import Authentication from '@/components/Authentication'

export default {
  name: 'AuthScreen',
  data () {
    return {
      snackbar: false,
      validLogin: false,
      validSignUp: false,
      signUpVisible: false,
      loginPasswordVisible: false,
      signUpPasswordVisible: false,
      rules: [ (value) => !!value || 'Обязательное поле' ],
      credentials: {
        username: '',
        password: ''
      },
      newUser: {
        username: '',
        password: ''
      },
      message: ''
    }
  },
  methods: {
    submitAuthentication () {
      Authentication.authenticate(this, this.credentials, '/')
    },

    submitSignUp () {
      Authentication.signup(this, this.newUser, '/')
    }
  }
}
</script>