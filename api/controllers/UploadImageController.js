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
    const value = req.body.data || undefined;

    if (!value) {
      res.status(400).send({ message: "no data to upload image" });
    }

    cloudinary.v2.uploader.upload(
      value,
      {
        folder: "the-wind-blows",
        // eslint-disable-next-line camelcase
        use_filename: true
      },
      (error, result) => {
        if (error) {
          res.status(500).send(error);
        }

        return res.status(201).send(result);
      }
    );
  },
  uploadImages: async (req, res) => {
    const values = req.body.data || undefined;

    if (!values) {
      res.status(400).send({ message: "no data to upload image" });
    }

    const promises = values.map(image =>
      cloudinary.v2.uploader.upload(image.base64, {
        folder: "the-wind-blows",
        // eslint-disable-next-line camelcase
        use_filename: true
      })
    );

    Promise.all(promises)
      .then(results => res.json(results))
      .catch(err => res.status(400).json(err));
  },
  deleteImage: async (req, res) => {
    const publicId = req.body.publicId || undefined;

    if (!publicId) {
      return res.status(400).send({ message: "public_id image request" });
    }

    cloudinary.v2.uploader.destroy(publicId, (error, result) => {
      if (error) {
        return res.status(400).send(error);
      }

      return res.status(200).send(result);
    });
  },
  deleteImages: async (req, res) => {
    const publicIds = req.body.publicIds || undefined;

    if (!publicIds) {
      return res.status(400).send({ message: "public_id images request" });
    }

    const promises = publicIds.map(publicId =>
      cloudinary.v2.uploader.destroy(publicId)
    );

    Promise.all(promises)
      .then(results => res.json(results))
      .catch(err => res.status(400).json(err));
  }
};
