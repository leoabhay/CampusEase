const mongoose = require('mongoose');

const connectdb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`Database connected successfully at ${process.env.MONGO_URI}`);
  } catch (error) {
    console.log('Database cannot be connected', error);
  }
};

module.exports = connectdb;