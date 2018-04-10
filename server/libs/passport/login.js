var LocalStrategy   = require('passport-local').Strategy;
var User = require('../../models/user').UserModel;

module.exports = function(passport){

  // Определяем стратегию логина для Passport
  passport.use('login', new LocalStrategy({
      passReqToCallback : true // передать запрос (request) в коллбэк, чтобы делать с ним всё, что угодно
    },
    function(req, username, password, done) { 
      // проверка в mongo, существует ли пользователь с таким логином
      User.findOne({ 'username' :  username }, 
        function(err, user) {
          // В случае возникновения любой ошибки, возврат с помощью метода done
          if (err)
            return done(err);
          // Пользователь не существует, ошибка входа и перенаправление обратно
          if (!user){
            console.log('User Not Found with username '+username);
            return done(null, false, 
                  req.flash('message', 'User Not found.'));                 
          }
          // Пользователь существует, но пароль введен неверно, ошибка входа 
          if (!user.checkPassword(password)){
            console.log('Invalid Password');
            return done(null, false, 
                req.flash('message', 'Invalid Password'));
          }
          // Пользователь существует и пароль верен, возврат пользователя и 
          // метода done, что будет означать успешную аутентификацию
          return done(null, user);
        }
      );
    }
  ));
  
}