const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    console.log("Multer File Filter:", file.originalname, file.mimetype);
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else if (
        file.mimetype === 'text/csv' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'text/plain' ||
        file.mimetype === 'application/csv' ||
        file.mimetype === '' // Allow empty mimetype which sometimes happens on Windows
    ) {
        cb(null, true);
    } else {
        console.error("Multer Rejected:", file.mimetype);
        cb(new Error(`Only images and CSV files are allowed! Received: ${file.mimetype}`), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = upload;
