const cloudinary = require('cloudinary').v2;

// Configuration 
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload
const uploadImage = async (imagePath) => {
  try {
    const result = await cloudinary.uploader.upload(imagePath);

    console.log(result);

    return result.secure_url;
  } catch (error) {
    console.error('Upload failed:', error);

    throw error;
  }
};

// Get asset info
const getAssetInfo = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId);
    
    console.log(result);

    return result;
  } catch (error) {
    console.error('Failed to get asset info:', error);

    throw error;
  }
};

module.exports = {
  uploadImage,
  getAssetInfo
};