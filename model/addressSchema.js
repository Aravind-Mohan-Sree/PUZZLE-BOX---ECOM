const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  contactName: {
    type: String
  },

  phone: {
    type: Number
  },

  pincode: {
    type: Number
  },

  state: {
    type: String
  },

  city: {
    type: String
  },

  house: {
    type: String
  },

  area: {
    type: String
  }
}, {_id: false});

module.exports = addressSchema;