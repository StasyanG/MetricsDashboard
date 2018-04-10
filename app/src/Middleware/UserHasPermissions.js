/* Auth Code Source: https://gist.github.com/hfalucas/60cb40c62e2e13e6c797f4887e43c8f6 */
/* Modified by StasyanG (2018-04-09) */

/**
 * This is where all the authorization login is stored
 */
import Authorization from '../Services/Authorization';

export default function UserHasPermissions (router) {
    /**
     * Before each route we will see if the current user is authorized
     * to access the given route
     */
    router.beforeEach((to, from, next) => {
        let authorized = false
        let user = JSON.parse(window.localStorage.getItem('atiiv.auth-user'))
        
        /**
         * Remember that access object in the routes? Yup this why we need it.
         *
         */
        console.log('to ' + to.name);
        if (to.meta.access !== undefined) {
            authorized = Authorization.authorize(
                to.meta.access.requiresLogin,
                to.meta.access.requiredPermissions,
                to.meta.access.permissionType
            )
            console.log(authorized);

            if (authorized === 'loginIsRequired') {
                router.push({name: 'LoginScreen'})
            }

            if (authorized === 'notAuthorized') {
                /**
                 * Redirects to a "default" page 
                 */
                router.push({name: 'LoginScreen'})
            }
        }
        /**
         * Everything is fine? Let's to the page then.
         */
        next();
    });
    console.log('UserHasPermissions');
}