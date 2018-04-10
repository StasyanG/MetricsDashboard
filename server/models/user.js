var mongoose = require('mongoose');
var crypto = require('crypto');

var Schema = mongoose.Schema;

var User = new Schema({
  username: { type: String, unique: true, required: true },
  hashedPassword: { type: String, required: true },
  salt: { type: String, required: true },
  role: { type: String, required: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  lastActive: { type: Date }
});

User.methods.encryptPassword = function(password) {
  return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
  // return crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512');
};
User.methods.generateSalt = function() {
  return crypto.randomBytes(32).toString('base64');
  // return crypto.randomBytes(128).toString('base64');
}

User.virtual('userId')
  .get(function () {
      return this._id;
  });

User.virtual('password')
  .set(function(password) {
      this._plainPassword = password;
      this.salt = generateSalt();
      this.hashedPassword = this.encryptPassword(password);
  })
  .get(function() { return this._plainPassword; });

User.virtual('level')
  .get(function() {
    if(role == 'admin') return 2;
    if(role == 'editor') return 1;
    if(role == 'viewer') return 0;
  });

User.methods.checkPassword = function(password) {
  return this.encryptPassword(password).toString() === this.hashedPassword;
};

var UserModel = mongoose.model('User', User);

module.exports.UserModel = UserModel;