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
    required: false
  },

  address: {
    type: [addressSchema],
    default: []
  },

  isBlocked: {
    type: Boolean,
    default: false
  },
  
  googleID: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('user', schema);