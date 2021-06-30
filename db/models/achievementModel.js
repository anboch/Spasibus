const { Schema, model } = require('mongoose');

const achievementSchema = new Schema({
  title: {
    type: String,
  },
  dateOfCreate: {
    type: Date,
    default: Date.now,
  },
  author: { type: Schema.Types.ObjectId, ref: 'User' },
});

// entrySchema.statics.quantityOfLikes = async function (entryId) {
//   const entry = await this.findOne({ _id: entryId });
//   return entry.authorOfLikes.length;
// };

const Achievement = model('Achievement', achievementSchema);

module.exports = Achievement;
