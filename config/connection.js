const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000    
    });

    console.log('MongoDB connected');
  } catch (err) {
    console.error(`Error occurred while connecting to database ${err}`);
  }
};

module.exports = connectDB;