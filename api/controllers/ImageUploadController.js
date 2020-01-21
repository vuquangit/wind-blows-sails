const dotenv = require("dotenv");
dotenv.config();

const cloudinary = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = {
  imageUpload: async (req, res) => {
    const values = req.body.data;

    const promises = values.map(image =>
      cloudinary.uploader.upload(image.base64, {
        folder: "the-wind-blows",
        use_filename: true
      })
    );

    Promise.all(promises)
      .then(results => res.json(results))
      .catch(err => res.status(400).json(err));
  }
};
