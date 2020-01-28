const dotenv = require("dotenv");
dotenv.config();

const cloudinary = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = {
  uploadImage: async (req, res) => {
    const values = req.body.data || undefined;

    if (!values) {
      res.status(400).send({ message: "no data to upload image" });
    }

    const promises = values.map(image =>
      cloudinary.uploader.upload(image.base64, {
        folder: "the-wind-blows",
        use_filename: true
      })
    );

    Promise.all(promises)
      .then(results => res.json(results))
      .catch(err => res.status(400).json(err));
  },
  deleteImage: async (req, res) => {
    const publicId = req.body.publicId || undefined;

    console.log(req.allParams());
    console.log("publicId", publicId);

    if (!publicId) {
      return res.status(400).send({ message: "public_id image request" });
    }

    cloudinary.v2.uploader.destroy(publicId, (error, result) => {
      console.log(result, error);
      if (error) {
        return res.status(400).send(error);
      }

      return res.status(200).send(result);
    });
  }
};
