/* Auth Code Source: https://gist.github.com/hfalucas/60cb40c62e2e13e6c797f4887e43c8f6 */

import UserHasPermissions from './Middleware/UserHasPermissions'
import RedirectIfAuthenticated from './Middleware/RedirectIfAuthenticated'

export default function middleware (router) {
  UserHasPermissions(router);
  RedirectIfAuthenticated(router);
}