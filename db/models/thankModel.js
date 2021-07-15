const { Schema, model } = require('mongoose');

const thankSchema = new Schema({
  title: {
    type: String,
  },
  dateOfCreate: {
    type: Date,
    default: Date.now,
  },
  thankColor: {
    type: String,
  },
  author: { type: Schema.Types.ObjectId, ref: 'User' },
});

const Thank = model('Thank', thankSchema);

module.exports = Thank;
