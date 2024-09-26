// multerConfig.js
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinaryConfig');

// Set up Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'podcasts', // Folder name in Cloudinary
    allowedFormats: ['jpeg', 'png', 'jpg', 'mp3', 'wav'],
    resource_type: 'auto', // This will allow both image and audio uploads
  },
});

// Initialize multer with the storage settings
const upload = multer({ storage });

module.exports = upload;
