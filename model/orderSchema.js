const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    userID: { type: String },

    products: [{
        productID: { 
            type: mongoose.Schema.Types.ObjectId ,
            ref:"product"
        },
        productName: { 
            type: String 
        },
        quantity: { 
            type: Number 
        },
        price: { 
            type: Number 
        },
        discount: { 
            type: Number 
        },
        productImage: { 
            type: String 
        }
    }],

    totalQuantity: { 
        type: Number 
    },

    totalPrice: { 
        type: Number 
    },

    address: {
        contactName: String,
        phone: String,
        pincode: String,
        state: String,
        city: String,
        house: String,
        area: String
    },

    paymentMethod: {
        type: String,
        required: true,
        enum: [ 'Cash on delivery']
    },

    isCancelled: {
        type: Boolean,
        default: false
    },

    deliveryDate:{
        type:Date,
    },

    orderStatus: { 
        type: String, 
        enum:['Pending','Confirmed','Shipping', 'Delivered','Pending-Returned', 'Returned', 'Cancelled']
    },

    reasonForCancel: {
        type:String
    },

    reasonForRejection: {
        type:String
    }
},{timestamps:true})

module.exports = mongoose.model("Order", schema);