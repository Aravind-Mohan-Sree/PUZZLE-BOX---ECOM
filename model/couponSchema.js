const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    name: {
        type: String,
    },

    code: {
        type: String,
    },

    discount: {
        type: Number,
    },

    minPurchase: {
        type: Number,
    },

    expiryDate: {
        type: Date,
    },

    isActive:{
        type:Boolean,
        default:true
    }
}, { timestamps: true });

module.exports = mongoose.model("coupon", schema);