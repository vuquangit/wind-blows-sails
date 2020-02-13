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
      return res.status(401).json({ message: "post Id request." });
    }

    if (!viewerId) {
      return res.status(401).json({ message: "viewer Id request." });
    }

    const data = await PostService.post(postId, viewerId);

    return res.status(200).send(data);
  },
  modifyPost: async (req, res) => {
    const postId = req.body.postId || undefined;
    const postParams = {
      caption: req.body.caption || "",
      commentsDisabled: req.body.commentsDisabled || false,
      location: req.body.location || "",
      captionIsEdited: true
    };

    if (!postId) {
      return res.status(401).json({ message: "post Id request." });
    }

    if (!postParams.sidecarChildren) {
      return res.status(401).json({ message: "image request." });
    }

    var updatedPost = await Posts.updateOne({ id: postId }).set(postParams);

    if (updatedPost) {
      return res.status(200).send(updatedPost);
    } else {
      return res.status(401).send({
        message: `The database does not contain a post id: ${postId}`
      });
    }
  },
  deletePost: async (req, res) => {
    const postId = req.body.postId || undefined;

    if (!postId) {
      return res
        .status(401)
        .json({ message: "Delete failed. Post ID request." });
    }

    // delete likes, comments, comments like ???
    await PostLikes.destroy({
      postId: postId
    });

    const commentsFound = await Posts.findOne({
      where: { id: postId }
    }).populate("commentsId");

    if (commentsFound !== undefined && commentsFound.commentsId.length > 0) {
      commentsFound.commentsId.map(async item => {
        await PostComments.destroy({
          id: item.id
        });

        await PostCommentsLikes.destroy({
          postCommentsId: item.id
        });
      });
    }

    // finally delete post
    const burnedPost = await Posts.destroyOne({ id: postId });

    if (burnedPost) {
      return res.status(200).json({ message: "Deleted this post" });
    } else {
      return res.status(202).json({
        message: `The database does not have a post id with postId: ${postId}`
      });
    }
  },

  // likes post
  likes: async (req, res) => {
    const postId = req.query.postId || undefined;
    const viewerId = req.query.viewerId || undefined;
    const limit = parseInt(req.query.limit || 20);
    const page = parseInt(req.query.page || 1);

    if (!postId) {
      return res.status(401).json({ message: "Post ID request." });
    }

    if (!viewerId) {
      return res.status(401).json({ message: "Viewer ID request." });
    }

    const skip = (page - 1) * limit;
    if (skip < 0) {
      return res.send({
        message: "page or limit not correct."
      });
    }

    const dataFound = await Posts.findOne({ id: postId }).populate("likeId", {
      skip: skip,
      limit: limit,
      sort: "createdAt DESC"
    });

    const totalLikes = await Posts.findOne({ id: postId }).populate("likeId");

    if (dataFound === undefined) {
      return res.status(401).send({ message: "Data likes post not found" });
    } else {
      // fetch follower info
      const fetchFollowers = async () => {
        const fetchRelationship = dataFound.likeId.map(async (item, idx) => {
          const user = await User.findOne({
            where: { id: item.userId },
            select: [
              "id",
              "fullName",
              "email",
              "isPrivate",
              "profilePictureUrl",
              "profilePicturePublicId",
              "username",
              "isVerified"
            ]
          });

          const relationship = await FollowService.relationship(
            item.userId,
            viewerId
          );

          return { user: user, relationship: relationship };
        });

        return Promise.all(fetchRelationship);
      };

      fetchFollowers().then(data => {
        return res
          .status(200)
          .send({ data: data, totalLikes: totalLikes.likeId.length });
      });
    }
  },
  likePost: async (req, res) => {
    const userId = req.body.userId || undefined;
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
      }).populate("ownerId");

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
            .then(async () => {
              // send notifications
              const receiverId = postValid.ownerId[0].id;
              const token = postValid.ownerId[0].notificationToken;
              const title = "New post likes";
              const body = `Username @${userValid.username} liked your photo`;

              await Notifications.create({
                senderId: userId,
                receiverId: receiverId,
                text: body,
                typeNotification: NotificationTypes.NEW_LIKE_POST,
                postId: postId,
                read: false
              });
              await FcmService.sendNotification(token, title, body);

              // response
              return res.status(201).ok();
            })
            .catch(err => {
              res.serverError(err);
            });
        }
      }
    }
  },
  unlikePost: async (req, res) => {
    const userId = req.body.userId || undefined;
    const postId = req.body.postId || undefined;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Like post failed. User id request." });
    }

    const burnedPostLike = await PostLikes.destroyOne({
      userId: userId,
      postId: postId
    });

    if (burnedPostLike) {
      return res.status(200).json({ message: "Unliked this post" });
    } else {
      return res.status(202).json({
        message: `The database does not have a post id with postId: ${postId} and userId: ${userId}.`
      });
    }
  },

  // comments post
  comments: async (req, res) => {
    const postId = req.query.postId || undefined;
    const viewerId = req.query.viewerId || undefined;
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
        if (user) {
          return user.commentsId.length;
        } else {
          return 0;
        }
      });

    const getDataComments = async () => {
      const comments = commentsFound.commentsId.map(async item => {
        const totalLikes = await PostComments.findOne({
          id: item.id
        }).populate("postCommentsLikesId");

        return {
          ...item,
          likeCount: totalLikes.postCommentsLikesId.length,
          likedByViewer:
            _.find(
              totalLikes.postCommentsLikesId,
              o => o.ownerId === viewerId
            ) !== undefined
        };
      });

      return Promise.all(comments);
    };

    getDataComments().then(comments => {
      const dataReponse = {
        id: commentsFound.id,
        captionAndTitle: commentsFound.caption,
        captionIsEdited: commentsFound.captionIsEdited,
        postedAt: commentsFound.createdAt,
        commentsDisabled: commentsFound.commentsDisabled,
        comments: comments,
        commentsTotalCount
      };

      return res.status(200).send(dataReponse);
    });
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
      })
        .populate("ownerId")
        .catch(err => {
          res.serverError(err);
        });

      if (postValid === undefined) {
        return res
          .status(401)
          .json({ message: "Add comments failed. Post ID is not valid." });
      } else {
        const postCommentsCreated = await PostComments.create(cmtParams)
          .fetch()
          .catch(err => {
            res.serverError(err);
          });

        // create notification
        const receiverId = _.get(postValid, "ownerId[0].id");
        const token = _.get(postValid, "ownerId[0].notificationToken") || "";
        const title = "New comments";
        const body = `Username @${userValid.username} has commented: "${
          cmtParams.text.length < 100
            ? cmtParams.text
            : `${cmtParams.text.slice(0, 100)}...`
        }" in your post`;
        const link = `/p/${cmtParams.postId}`;

        await Notifications.create({
          senderId: cmtParams.userId,
          receiverId: receiverId,
          text: cmtParams.text,
          typeNotification: NotificationTypes.NEW_COMMENT,
          postId: cmtParams.postId,
          commentsId: postCommentsCreated.id,
          read: false
        });

        if (token) await FcmService.sendNotification(token, title, body, link);

        // response data
        return res.status(201).send(postCommentsCreated);
      }
    }
  },
  deleteComments: async (req, res) => {
    const commentsId = req.body.commentsId || undefined;

    if (!commentsId) {
      return res
        .status(401)
        .json({ message: "Delete comments failed. Comments ID request." });
    }

    const burnedPostComments = await PostComments.destroyOne({
      id: commentsId
    });

    if (burnedPostComments) {
      // delete noti add comments
      await Notifications.destroy({
        typeNotification: NotificationTypes.NEW_COMMENT,
        commentsId: commentsId
      });

      return res.status(200).json({ message: "Deleted this comment" });
    } else {
      return res.status(202).json({
        message: `The database does not have a comments with id: ${commentsId}.`
      });
    }
  },

  // likes comments post
  likesComments: async (req, res) => {
    const commentsId = req.query.commentsId || undefined;
    const viewerId = req.query.viewerId || undefined;
    const limit = parseInt(req.query.limit || 20);
    const page = parseInt(req.query.page || 1);

    if (!commentsId) {
      return res
        .status(401)
        .json({ message: "Like comments failed. Comments ID request." });
    }

    if (!viewerId) {
      return res
        .status(401)
        .json({ message: "Like comments failed. Viewer ID request." });
    }

    const skip = (page - 1) * limit;
    if (skip < 0) {
      return res.send({
        message: "Like comments failed. Page or limit number not correct."
      });
    }

    const dataFound = await PostComments.findOne({ id: commentsId }).populate(
      "postCommentsLikesId",
      {
        skip: skip,
        limit: limit,
        sort: "createdAt DESC"
      }
    );

    const totalLikes = await PostComments.findOne({ id: commentsId }).populate(
      "postCommentsLikesId"
    );

    if (dataFound === undefined) {
      return res.status(401).send({
        message: "Like comments failed. Data likes comments not found"
      });
    } else {
      // fetch follower info
      const fetchFollowers = async () => {
        const fetchRelationship = dataFound.postCommentsLikesId.map(
          async (item, idx) => {
            const user = await User.findOne({
              where: { id: item.ownerId },
              select: [
                "id",
                "fullName",
                "email",
                "isPrivate",
                "profilePictureUrl",
                "profilePicturePublicId",
                "username",
                "isVerified"
              ]
            });

            const relationship = await FollowService.relationship(
              item.ownerId,
              viewerId
            );

            return { user: user, relationship: relationship };
          }
        );

        return Promise.all(fetchRelationship);
      };

      fetchFollowers().then(data => {
        return res.status(200).send({
          data: data,
          totalLikes: totalLikes.postCommentsLikesId.length
        });
      });
    }
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

    if (userValid === undefined) {
      return res.send({ message: "user id not valid" });
    } else {
      const postValid = await PostComments.findOne({
        id: commentsId
      });

      if (postValid === undefined) {
        return res.send({ message: "post comments id not valid" });
      } else {
        const postCommentsFound = await PostComments.findOne({
          id: commentsId
        })
          .populate("postCommentsLikesId", {
            where: { ownerId: userId }
          })
          .populate("userId")
          .populate("postId");

        if (
          postCommentsFound !== undefined &&
          postCommentsFound.postCommentsLikesId.length > 0
        ) {
          return res
            .status(202)
            .send({ message: "user id has liked this post id" });
        } else {
          const commentsLikeCreated = await PostCommentsLikes.create({
            ownerId: userId,
            postCommentsId: commentsId
          }).catch(err => {
            res.serverError(err);
          });

          // create notification
          console.log(userId === _.get(postCommentsFound, "userId.id"));

          if (userId !== _.get(postCommentsFound, "userId.id")) {
            const token =
              _.get(postCommentsFound, "userId.notificationToken") || "";
            const title = "New like comments";
            const body = `Username @${
              userValid.username
            } liked your comments: "${
              postCommentsFound.text.length < 100
                ? postCommentsFound.text
                : `${postCommentsFound.text.slice(0, 100)}...`
            }" in your post`;
            const postId = _.get(postCommentsFound, "postId.id");
            const link = `/p/${postId}`;

            await Notifications.create({
              senderId: userId,
              receiverId: _.get(postCommentsFound, "userId.id"),
              text: postCommentsFound.text,
              typeNotification: NotificationTypes.NEW_LIKE_COMMENT,
              postId,
              commentsId: commentsId,
              read: false
            });

            if (token)
              await FcmService.sendNotification(token, title, body, link);
          }

          return res.status(200).send({ message: "Liked this comments" });
        }
      }
    }
  },
  unlikeComments: async (req, res) => {
    const userId = req.body.userId || undefined;
    const commentsId = req.body.commentsId || undefined;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unlike comments failed. userId request." });
    }

    if (!commentsId) {
      return res
        .status(401)
        .json({ message: "Unlike comments failed. commentsId request." });
    }

    const burnedPostLike = await PostCommentsLikes.destroyOne({
      ownerId: userId,
      postCommentsId: commentsId
    });

    if (burnedPostLike) {
      return res.status(200).json({ message: "Unliked this comments" });
    } else {
      return res.status(202).json({
        message: `The database does not have a post id with comments Id: ${commentsId} and user Id: ${userId}.`
      });
    }
  }
};
