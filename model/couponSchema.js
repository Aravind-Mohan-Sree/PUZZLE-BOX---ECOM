const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    couponName: {
        type: String,
    },

    couponCode: {
        type: String,
    },

    discount: {
        type: Number,
    },

    expiryDate: {
        type: Date,
    },

    minAmount: {
        type: Number,
    },

    isActive:{
        type:Boolean,
        default:true
    }
}, { timestamps: true });

module.exports = mongoose.model("coupon", schema);