const PassportJWT = require('passport-jwt'),
      ExtractJWT = PassportJWT.ExtractJwt,
      Strategy = PassportJWT.Strategy,
      CONFIG = process.env.NODE_ENV == 'prod' ? require('../config/prod') : require('../config/dev'),
      User = require('../models/user').UserModel;

module.exports = (passport) => {
  const parameters = {
    secretOrKey: CONFIG.SECRET,
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken()
  };
  passport.use(new Strategy(parameters, (payload, done) => {
    User.findOne({ id: payload.id }, (error, user) => {
      if (error) return done(error, false);
      if (user) done(null, user);
      else done(null, false);
    });
  }));
}