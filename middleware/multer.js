const multer = require('multer');

// multer for storing images
const storage = multer.diskStorage({
    // destination of the file to store is set as ./uploads
    destination: function (req, file, cb) {
        cb(null, `./uploads`);
    },     
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const fileFilter = (req, res, cb) => {
  if (file.mimetype === 'image/webp') {
    cb(null, true);
  } else {
    cb({message: 'Unsupported file format'}, false);
  }
};

const upload = multer({
  storage,
  fileFilter
});

module.exports = upload;