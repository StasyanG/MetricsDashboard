var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var Schema = mongoose.Schema;

var User = new Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  lastActive: { type: Date }
});

User.virtual('level')
  .get(function() {
    if(role == 'admin') return 2;
    if(role == 'editor') return 1;
    if(role == 'viewer') return 0;
  });

User.pre('save', function (next) {
  const user = this;
  if (this.isModified('password') || this.isNew) {
    bcrypt.genSalt(10, (error, salt) => {
    if (error) return next(error);
    bcrypt.hash(user.password, salt, (error, hash) => {
      if (error) return next(error);
      user.password = hash;
        next();
      });
    });
  } else {
    return next();
  }
});

User.methods.comparePassword = function (password, callback) {
  bcrypt.compare(password, this.password, (error, matches) => {
    if (error) return callback(error);
    callback(null, matches);
  });
};

var UserModel = mongoose.model('User', User);

module.exports.UserModel = UserModel;