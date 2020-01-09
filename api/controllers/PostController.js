module.exports = {
  addPost: async (req, res) => {
    const postParams = {
      caption: req.body.caption || "",
      commentsDisabled: req.body.commentsDisabled || false,
      location: req.body.location || "",
      src: req.body.src || undefined,
      captionIsEdited: req.body.captionIsEdited || false,
      ownerId: req.body.ownerId || undefined
    };

    if (!postParams.ownerId)
      return res.status(401).json({ message: "Add failed. Owner ID request." });

    if (!postParams.src)
      return res
        .status(401)
        .json({ message: "Add failed. Image source request" });

    const userValid = await User.findOne({
      id: postParams.ownerId
    }).catch(err => {
      res.serverError(err);
    });

    if (userValid === undefined)
      return res.status(401).json({ message: "Add failed. User not found." });
    else {
      const posted = await Posts.create(postParams)
        .fetch()
        .catch(err => {
          res.serverError(err);
        });
      return res.status(201).send(posted);
    }
  },
  post: async (req, res) => {
    const postId = req.body.postId || undefined;

    if (!postId)
      return res
        .status(401)
        .json({ message: "Comments failed. User id request." });

    await Posts.findOne({
      where: { id: postId },
      select: ["id", "caption", "createdAt", "commentsDisabled"]
    })
      .populate("ownerId", {
        select: [
          "id",
          "fullName",
          "isNew",
          "isPrivate",
          "profilePictureUrl",
          "username",
          "isUnpublished",
          "isVerified"
        ]
      })
      .exec((err, result) => {
        if (err) {
          return res.serverError(err);
        }

        if (!result)
          return res.status(404).send({
            message: "Post ID not found"
          });
        else return res.status(200).json(result);
      });
  },
  likePost: async (req, res) => {
    const userId = req.body.ownerId || undefined;
    const postId = req.body.postId || undefined;

    if (!userId)
      return res
        .status(401)
        .json({ message: "Like post failed. User id request." });

    if (!postId)
      return res
        .status(401)
        .json({ message: "Like post failed. Post id request." });

    const userValid = await User.findOne({
      id: userId
    }).catch(err => {
      res.serverError(err);
    });

    if (userValid === undefined)
      return res
        .status(401)
        .json({ message: "Like post failed. User ID is not valid." });
    else {
      const postValid = await Posts.findOne({
        id: postId
      });

      if (postValid === undefined)
        return res
          .status(401)
          .json({ message: "Like post failed. Post ID is not valid." });
      else {
        const userLiked = await PostLikes.findOne({
          userId: userId,
          postId: postId
        }).catch(err => {
          res.serverError(err);
        });

        if (userLiked !== undefined)
          return res
            .status(401)
            .send({ message: "user ID has liked this post ID" });
        else {
          await PostLikes.create({
            userId: userId,
            postId: postId
          })
            .then(() => {
              return res.status(201).ok();
            })
            .catch(err => {
              res.serverError(err);
            });
        }
      }
    }
  },
  addComments: async (req, res) => {
    const cmtParams = {
      isAuthorVerified: req.body.isAuthorVerified || false,
      text: req.body.text || "",
      userId: req.body.userId || undefined,
      postId: req.body.postId || undefined
    };

    if (!cmtParams.userId)
      return res
        .status(401)
        .json({ message: "Add comments failed. User ID request." });

    if (!cmtParams.postId)
      return res
        .status(401)
        .json({ message: "Add comments failed. Post ID request." });

    const userValid = await User.findOne({
      id: cmtParams.userId
    }).catch(err => {
      return res.serverError(err);
    });

    if (userValid === undefined)
      return res
        .status(401)
        .json({ message: "Add comments failed. User ID is not valid." });
    else {
      const postValid = await Posts.findOne({
        id: cmtParams.postId
      }).catch(err => {
        res.serverError(err);
      });

      if (postValid === undefined)
        return res
          .status(401)
          .json({ message: "Add comments failed. Post ID is not valid." });
      else {
        await PostComments.create(cmtParams)
          .then(() => {
            return res.status(201).ok();
          })
          .catch(err => {
            res.serverError(err);
          });
      }
    }
  },
  comments: async (req, res) => {
    const postId = req.body.postId || undefined;
    const limit = parseInt(req.query.limit || 20);
    const page = parseInt(req.query.page || 1);

    if ((page - 1) * limit < 0) {
      return res.send({
        message: "page or limit not correct"
      });
    }

    if (!postId)
      return res
        .status(401)
        .json({ message: "Comments failed. User id request." });

    await Posts.findOne({
      where: { id: postId },
      select: ["id", "createdAt", "commentsDisabled", "ownerId"]
    })
      .populate("commentsId", {
        skip: (page - 1) * limit,
        limit: limit,
        sort: "createdAt ASC"
      })
      .exec((err, result) => {
        if (err) {
          return res.serverError(err);
        }

        return res.status(200).json(result);
      });
  },
  likeComments: async (req, res) => {
    const userId = req.body.userId || undefined;
    const commentsId = req.body.commentsId || undefined;

    if (!userId)
      return res.send({
        message: "user id request"
      });

    if (!commentsId)
      return res.send({
        message: "post comments id request"
      });

    const userValid = await User.findOne({
      id: userId
    });

    if (userValid === undefined)
      return res.send({ message: "user id not valid" });
    else {
      const postValid = await PostComments.findOne({
        id: commentsId
      });

      if (postValid === undefined)
        return res.send({ message: "post comments id not valid" });
      else {
        const userLiked = await PostCommentsLikes.findOne({
          userId: userId,
          postCommentsId: commentsId
        });

        if (userLiked !== undefined)
          return res.send({ message: "user id has liked this post id" });
        else {
          await PostCommentsLikes.create({
            userId: userId,
            postCommentsId: commentsId
          }).exec((err, data) => {
            if (err) {
              return res.serverError(err);
            }

            return res.ok();
          });
        }
      }
    }
  }
};
