const cloudinary = require('cloudinary').v2;

// Configuration 
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload
const uploadImages = async (imagePath) => {
  try {
    const result = await cloudinary.uploader.upload(imagePath);

    console.log(result);

    return result.secure_url;
  } catch (error) {
    console.error('Upload failed:', error);

    throw error;
  }
};

// Delete images based on an array of URLs
const deleteImages = async (imageUrls) => {
  try {
    const deletePromises = imageUrls.map(async (url) => {
      // Extract the public ID from the URL
      const publicId = url.split('/').pop().split('.')[0];

      await cloudinary.uploader.destroy(publicId);
      console.log(`Deleted image with public ID: ${publicId}`);
    });

    // Wait for all delete operations to complete
    await Promise.all(deletePromises);

    console.log('All specified images have been deleted.');
  } catch (error) {
    console.error('Failed to delete images:', error);

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
}

module.exports = {
  uploadImages,
  deleteImages,
  getAssetInfo
};