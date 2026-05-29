const multer = require("multer");
const path = require("path");

/* Storage config */

const storage = multer.diskStorage({

    destination: function(req, file, cb) {
        cb(null, "uploads/issueImages/");
    },

    filename: function(req, file, cb) {

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }

});

/* File filter */

const fileFilter = (req, file, cb) => {

    const allowedTypes = [
        "image/jpeg", 
        "image/png", 
        "image/jpg",
        "image/gif",
        "image/webp",
        "image/bmp"
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed"));
    }

};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});

module.exports = upload;