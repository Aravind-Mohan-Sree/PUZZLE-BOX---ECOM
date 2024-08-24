const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  contactName: {
    type: String
  },

  pincode: {
    type: Number
  },

  homeAddress: {
    type: String
  },

  areaAddress: {
    type: String
  },

  landmark: {
    type: String
  }
}, {_id: false});

module.exports = addressSchema;