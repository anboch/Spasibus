const { Schema, model } = require('mongoose');
const Thank = require('./thankModel');

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  avatarHref: {
    type: String,
    default: '/img/defaultAvatar.png',
  },
  telegramId: {
    type: Number,
    default: 0,
  },
});

userSchema.statics.filterByHasThank = async function () {
  const users = await this.aggregate([
    {
      $lookup: {
        from: 'thanks',
        localField: '_id',
        foreignField: 'recipient',
        as: 'thanks',
      },
    },
  ]);
  const usersWithThanks = users.filter((user) => user.thanks.length > 0);
  return usersWithThanks;
};

const User = model('User', userSchema);

module.exports = User;
