const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/lanceconnect';
    
    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }
    
    console.log('Attempting to connect to MongoDB...');
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log("✅ MongoDB connected successfully to:", mongoURI.split('@')[1] || 'local database');
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    console.error("Please check your MONGO_URI in .env file");
    process.exit(1);
  }
};

module.exports = connectDB;