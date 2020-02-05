module.exports = {
  addPost: async (req, res) => {
    const postParams = {
      caption: req.body.caption || "",
      commentsDisabled: req.body.commentsDisabled || false,
      location: req.body.location || "",
      captionIsEdited: req.body.captionIsEdited || false,
      ownerId: req.body.ownerId || undefined,
      sidecarChildren: req.body.sidecarChildren || undefined
    };

    if (!postParams.ownerId) {
      return res.status(401).json({ message: "Add failed. Owner ID request." });
    }

    if (
      postParams.sidecarChildren === undefined ||
      postParams.sidecarChildren.length === 0
    ) {
      return res
        .status(401)
        .json({ message: "Add failed. Image source request" });
    }

    const userValid = await User.findOne({
      id: postParams.ownerId
    }).catch(err => {
      res.serverError(err);
    });

    if (userValid === undefined) {
      return res.status(401).json({ message: "Add failed. User not found." });
    } else {
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
    const viewerId = req.body.viewerId || undefined;

    if (!postId) {
      return res
        .status(401)
        .json({ message: "Comments failed. Post ID request." });
    }

    if (!viewerId) {
      return res
        .status(401)
        .json({ message: "Comments failed. Post ID request." });
    }

    await PostService.post(postId, viewerId, (err, data) => {
      if (err) return res.serverError(err);

      return res.status(200).send(data);
    });

    // const fetchPost = async () => await PostService.post(postId, viewerId);
    // Promise.all(fetchPost()).then(data => {
    //   console.log("respone", data);
    //   return res.status(200).send(data);
    // });

    // await Posts.findOne({
    //   where: { id: postId }
    // })
    //   .populate("ownerId", {
    //     select: [
    //       "id",
    //       "fullName",
    //       "isNew",
    //       "isPrivate",
    //       "profilePictureUrl",
    //       "username",
    //       "isUnpublished",
    //       "isVerified"
    //     ]
    //   })
    //   .populate("likeId")
    //   .populate("savedId", {
    //     where: {
    //       id: viewerId
    //     }
    //   })
    //   .populate("commentsId")
    //   .exec((err, result) => {
    //     if (err) {
    //       return res.serverError(err);
    //     }

    //     if (!result) {
    //       return res.status(404).send({
    //         message: "Post ID not found"
    //       });
    //     } else {
    //       // get realationship
    //       const ownerId = result.ownerId[0].id;
    //       const getRelationship = async () =>
    //         await FollowService.relationship(ownerId, viewerId);

    //       // data response
    //       getRelationship().then(relationship => {
    //         const { post } = {
    //           post: {
    //             id: result.id,
    //             caption: result.caption,
    //             captionIsEdited: result.captionIsEdited,
    //             commentsDisabled: result.commentsDisabled,
    //             postAt: result.createdAt,
    //             owner: result.ownerId[0],
    //             sidecarChildren: result.sidecarChildren,

    //             likedByViewer:
    //               _.find(result.likeId, ["id", viewerId]) !== undefined,
    //             savedByViewer: result.savedId.length > 0,
    //             numLikes: result.likeId.length,
    //             numComments: result.commentsId.length,

    //             relationship: relationship
    //           }
    //         };

    //         return res.status(200).send({
    //           post,
    //           owner: result.ownerId[0],
    //           relationship,
    //           likedByViewer:
    //             _.find(result.likeId, ["id", viewerId]) !== undefined,
    //           savedByViewer: result.savedId.length > 0
    //         });
    //       });
    //     }
    //   });
  },
  likePost: async (req, res) => {
    const userId = req.body.ownerId || undefined;
    const postId = req.body.postId || undefined;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Like post failed. User id request." });
    }

    if (!postId) {
      return res
        .status(401)
        .json({ message: "Like post failed. Post id request." });
    }

    const userValid = await User.findOne({
      id: userId
    }).catch(err => {
      res.serverError(err);
    });

    if (userValid === undefined) {
      return res
        .status(401)
        .json({ message: "Like post failed. User ID is not valid." });
    } else {
      const postValid = await Posts.findOne({
        id: postId
      });

      if (postValid === undefined) {
        return res
          .status(401)
          .json({ message: "Like post failed. Post ID is not valid." });
      } else {
        const userLiked = await PostLikes.findOne({
          userId: userId,
          postId: postId
        }).catch(err => {
          res.serverError(err);
        });

        if (userLiked !== undefined) {
          return res
            .status(401)
            .send({ message: "user ID has liked this post ID" });
        } else {
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
      text: req.body.text || "",
      userId: req.body.userId || undefined,
      postId: req.body.postId || undefined
    };

    if (!cmtParams.userId) {
      return res
        .status(401)
        .json({ message: "Add comments failed. User ID request." });
    }

    if (!cmtParams.postId) {
      return res
        .status(401)
        .json({ message: "Add comments failed. Post ID request." });
    }

    const userValid = await User.findOne({
      id: cmtParams.userId
    }).catch(err => {
      return res.serverError(err);
    });

    if (userValid === undefined) {
      return res
        .status(401)
        .json({ message: "Add comments failed. User ID is not valid." });
    } else {
      const postValid = await Posts.findOne({
        id: cmtParams.postId
      }).catch(err => {
        res.serverError(err);
      });

      if (postValid === undefined) {
        return res
          .status(401)
          .json({ message: "Add comments failed. Post ID is not valid." });
      } else {
        const dataCreated = await PostComments.create(cmtParams)
          .fetch()
          .catch(err => {
            res.serverError(err);
          });
        return res.status(201).send(dataCreated);
      }
    }
  },
  comments: async (req, res) => {
    const postId = req.query.postId || undefined;
    const limit = parseInt(req.query.limit || 20);
    const page = parseInt(req.query.page || 1);

    if ((page - 1) * limit < 0) {
      return res.send({
        message: "page or limit not correct"
      });
    }

    if (!postId) {
      return res
        .status(401)
        .json({ message: "Comments failed. User id request." });
    }

    const commentsFound = await Posts.findOne({
      where: { id: postId }
    }).populate("commentsId", {
      skip: (page - 1) * limit,
      limit: limit,
      sort: "createdAt DESC"
    });

    const commentsTotalCount = await Posts.findOne({
      where: { id: postId }
    })
      .populate("commentsId")
      .then(user => {
        if (user) return user.commentsId.length;
        else return 0;
      });

    const dataReponse = {
      id: commentsFound.id,
      captionAndTitle: commentsFound.caption,
      captionIsEdited: commentsFound.captionIsEdited,
      postedAt: commentsFound.createdAt,
      commentsDisabled: commentsFound.commentsDisabled,
      comments: commentsFound.commentsId,
      commentsTotalCount
    };

    return res.status(200).send(dataReponse);
  },
  likeComments: async (req, res) => {
    const userId = req.body.userId || undefined;
    const commentsId = req.body.commentsId || undefined;

    if (!userId) {
      return res.send({
        message: "user id request"
      });
    }

    if (!commentsId) {
      return res.send({
        message: "post comments id request"
      });
    }

    const userValid = await User.findOne({
      id: userId
    });

    if (userValid === undefined) {
      return res.send({ message: "user id not valid" });
    } else {
      const postValid = await PostComments.findOne({
        id: commentsId
      });

      if (postValid === undefined) {
        return res.send({ message: "post comments id not valid" });
      } else {
        const userLiked = await PostCommentsLikes.findOne({
          userId: userId,
          postCommentsId: commentsId
        });

        if (userLiked !== undefined) {
          return res.send({ message: "user id has liked this post id" });
        } else {
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
