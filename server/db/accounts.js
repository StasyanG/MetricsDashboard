const Account = require('../models/Account')

const getAccounts = (user) => {
  return new Promise((resolve, reject) => {
    Account.find({
      owner: user.username
    }).exec()
      .then(res => resolve(res))
      .catch(err => reject(err))
  })
}

const getAccount = (_id) => {
  return new Promise((resolve, reject) => {
    Account.findById(_id, (err, account) => {
      if (err) {
        return reject(err);
      }
      return resolve(account);
    })
  })
}

const insertAccount = (account) => {
  return new Promise((resolve, reject) => {
    const accountObj = new Account(account)
    accountObj.save()
      .then(res => resolve(res))
      .catch(err => reject(err))
  })
}

const updateAccount = (_id, updates) => {
  return new Promise((resolve, reject) => {
    Account.findById(_id, (err, account) => {
      if (err) {
        return reject(err);
      }
      Object.keys(updates).forEach(key => {
        account.set({ [key]: updates[key] })
      })
      account.save((err, updatedAccount) => {
        if (err) {
          return reject(err);
        }
        return resolve(updatedAccount);
      })
    })
  })
}

const removeAccount = (_id) => {
  return new Promise((resolve, reject) => {
    Account.remove({
      _id: _id
    }).exec()
      .then(() => resolve(null))
      .catch(err => reject(err))
  })
}

module.exports = {
  getAccounts, getAccount, insertAccount, updateAccount, removeAccount
}