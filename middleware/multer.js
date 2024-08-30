const multer = require('multer');

// multer for storing images
const storage = multer.diskStorage({});

const upload = multer({
  storage
});

module.exports = upload;