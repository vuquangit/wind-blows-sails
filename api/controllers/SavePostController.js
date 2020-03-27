module.exports = {
  posts: async (req, res) => {
    const ownerId = req.query.ownerId || undefined;
    const viewerId = req.query.viewerId || undefined;
    const limit = parseInt(req.query.limit || 20);
    const page = parseInt(req.query.page || 1);

    if ((page - 1) * limit < 0) {
      return res.send({
        message: "page or limit not correct"
      });
    }

    if (!ownerId) {
      return res.status(400).send({ message: "ownerId is request" });
    }

    if (!viewerId) {
      return res.status(400).send({ message: "viewerId is request" });
    }

    const postFound = await User.findOne({
      where: { id: ownerId },
      select: ["id"]
    }).populate("savedId", {
      skip: (page - 1) * limit,
      limit: limit,
      sort: "createdAt DESC"
    });

    // maybe don't need find ???
    const fetchPost = async () =>
      await Promise.all(
        postFound.savedId.map(
          async item => await PostService.post(item.postId, viewerId)
        )
      );

    fetchPost().then(async data => {
      // count total posts item
      const totalItem = await User.findOne({
        where: { id: ownerId }
      })
        .populate("savedId")
        .then(user => {
          if (user) {
            return user.savedId.length;
          } else {
            return 0;
          }
        });

      // data response
      if (data !== undefined) {
        return res.send({ data: data, totalItem: totalItem });
      } else {
        return res.status(400).send({ message: "User id not found" });
      }
    });
  },
  savePost: async (req, res) => {
    const userId = req.body.userId || undefined;
    const postId = req.body.postId || undefined;

    if (!userId) {
      return res
        .status(400)
        .json({ message: "Save post failed. User id request." });
    }

    if (!postId) {
      return res
        .status(400)
        .json({ message: "Save post failed. Post id request." });
    }

    const userValid = await User.findOne({
      id: userId
    }).catch(err => {
      res.serverError(err);
    });

    if (userValid === undefined) {
      return res
        .status(400)
        .json({ message: "Save post failed. User ID is not valid." });
    } else {
      const postValid = await Posts.findOne({
        id: postId
      });

      if (postValid === undefined) {
        return res
          .status(400)
          .json({ message: "Save post failed. Post ID is not valid." });
      } else {
        const userLiked = await SavePost.findOne({
          ownerId: userId,
          postId: postId
        }).catch(err => {
          res.serverError(err);
        });

        if (userLiked !== undefined) {
          return res
            .status(400)
            .send({ message: "userID has saved this postdId" });
        } else {
          await SavePost.create({
            ownerId: userId,
            postId: postId
          })
            .then(() => {
              return res.status(201).send({ message: "Saved post" });
            })
            .catch(err => {
              res.serverError(err);
            });
        }
      }
    }
  },

  deleteSavePost: async (req, res) => {
    const userId = req.body.userId || undefined;
    const postId = req.body.postId || undefined;

    if (!userId) {
      return res
        .status(400)
        .json({ message: "Delete save post failed. User id request." });
    }

    if (!postId) {
      return res
        .status(400)
        .json({ message: "Delete save post failed. Post id request." });
    }

    const userValid = await User.findOne({
      id: userId
    }).catch(err => {
      res.serverError(err);
    });

    if (userValid === undefined) {
      return res
        .status(400)
        .json({ message: "Delete save post failed. User ID is not valid." });
    } else {
      const postValid = await Posts.findOne({
        id: postId
      });

      if (postValid === undefined) {
        return res
          .status(400)
          .json({ message: "Delete save post failed. Post ID is not valid." });
      } else {
        const burnedPostLike = await SavePost.destroyOne({
          ownerId: userId,
          postId: postId
        });

        if (burnedPostLike) {
          return res.status(200).json({ message: "Deleted save this post" });
        } else {
          return res.status(202).json({
            message: `The database does not have a post id with postId: ${postId} and userId: ${userId}.`
          });
        }
      }
    }
  }
};
