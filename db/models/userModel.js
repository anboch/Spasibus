const { Schema, model } = require('mongoose');

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
  },
  lastName: {
    type: String,
  },
  avatarHref: {
    type: String,
  },
  achievements: [{ type: Schema.Types.ObjectId, ref: 'Achievement' }],
});

// entrySchema.statics.quantityOfLikes = async function (entryId) {
//   const entry = await this.findOne({ _id: entryId });
//   return entry.authorOfLikes.length;
// };

const User = model('User', userSchema);

module.exports = User;
