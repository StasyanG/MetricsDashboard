/* Auth Code Source: https://gist.github.com/hfalucas/60cb40c62e2e13e6c797f4887e43c8f6 */
/* Modified by StasyanG (2018-04-09) */

export default function RedirectIfAuthenticated (router) {
  /**
   * If the user is already authenticated he shouldn't be able to visit 
   * pages like login, register, etc...
   */
    router.beforeEach((to, from, next) => {
        let token = window.localStorage.getItem('token')
        let user = JSON.parse(window.localStorage.getItem('auth-user'))

        /**
         * Checks if there's a token and the next page name is none of the following
         */
        if ((token) && (to.name === 'LoginScreen' || to.name === 'RegisterScreen')) {
            // redirects according user role
            router.replace('/monitor')
        }

        if (!token) {
            // Logout
        }

        next()
    });
    console.log('RedirectIfAuthenticated');
}