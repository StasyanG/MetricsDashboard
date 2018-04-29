// Thanks to
// https://habr.com/company/ruvds/blog/340926/

import axios from 'axios';
import jwt_decode from 'jwt-decode';

import router from '../../router';

export default {
  user: { 
    authenticated: false,
    info: null
  },

  authenticate (context, credentials, redirect) {
    axios.post(`${process.env.API_URL}/auth/login`, credentials)
        .then(({data: {token}}) => {
          context.$cookie.set('token', token, '1D'); // expires in 1D (1 day)
          context.validLogin = true;
          this.user.authenticated = true;
          this.user.info = this.getUserInfo(token);

          if (redirect) router.push(redirect);
        }).catch(({response: {data}}) => {
          context.snackbar = true;
          context.message = data.message;
        })
  },

  signup (context, credentials, redirect) {
    axios.post(`${process.env.API_URL}/auth/signup`, credentials)
        .then(({data: {token}}) => {
          context.$cookie.set('token', token, '1D'); // expires in 1D (1 day)
          context.validSignUp = true;
          this.user.authenticated = true;
          
          if (redirect) router.push(redirect);
        }).catch(({response: {data}}) => {
          context.snackbar = true;
          context.message = data.message;
        })
  },

  checkAuthentication () {
    const token = document.cookie;

    if (token) {
      this.user.authenticated = true;
      this.user.info = this.getUserInfo(token);
    } else {
      this.user.authenticated = false;
    }
  },

  getAuthenticationHeader (context) {
    return `Bearer ${context.$cookie.get('token')}`;
  },

  getUserInfo(token) {
    console.log('Token: ' + token);
    return token ? jwt_decode(token).user : null;
  },

  logout(context, redirect) {
    axios.post(`${process.env.API_URL}/auth/logout`)
        .then(() => {
          context.$cookie.delete('token');
          this.user.authenticated = false;
          this.user.info = null;
          
          if (redirect) router.push(redirect);
          else router.push('/auth');
        }).catch((error) => {
          console.log('Error /auth/logout! ' + error);
        })
  }
}