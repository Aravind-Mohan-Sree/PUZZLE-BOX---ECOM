const mongoose = require('mongoose');
const addressSchema = require('../model/addressShema');

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true
  },

  phone: {
    type: Number
  },

  password: {
    type: String,
    required: true
  },

  address: {
    type: [addressSchema],
    default: []
  },

  googleID: {
    type: String
  }
}, {timestamps: true});

module.exports = mongoose.model('user', schema);