module.exports = {
  addFollow: async (req, res) => {
    const viewerId = req.body ? req.body.viewerId : undefined;
    const userId = req.body ? req.body.userId : undefined;

    //#region Check valid
    if (!viewerId || !userId) {
      return res.status(400).send({
        message: "id or id following request"
      });
    }

    if (viewerId === userId) {
      return res.status(400).send({
        message: "id and id following is duplicate"
      });
    }

    // check id owner
    const userOwner = await User.findOne({
      where: { id: viewerId }
    });

    if (userOwner === undefined) {
      return res.status(400).send({
        message: "owner id not found"
      });
    }

    // check id follow
    const userFollowing = await User.findOne({
      where: { id: userId }
    });

    if (userFollowing === undefined) {
      return res.status(400).send({
        message: "user id will following not found"
      });
    }
    //#endregion

    const followFound = await User.findOne({
      where: { id: viewerId }
    }).populate("following", {
      where: { id: userId }
    });

    if (followFound.following.length) {
      return res.status(400).send({ message: "owner id adready following" });
    } else {
      await User.addToCollection(viewerId, "following", userId);
    }

    // create notification
    const token = _.get(userFollowing, "notificationToken") || "";
    const title = "New following";
    const body = `Username @${userFollowing.username} has  following you`;
    const link = `/${userOwner.username}`;

    await Notifications.create({
      senderId: viewerId,
      receiverId: userId,
      typeNotification: NotificationTypes.NEW_FOLLOW,
      read: false
    });

    if (token) {
      await FcmService.sendNotification(token, title, body, link);
    }

    // response
    return res.status(200).send("You have already followed this account");
  },
  unfollow: async (req, res) => {
    const viewerId = req.body.viewerId;
    const idUnfollow = req.body.userId;

    if (!viewerId || !idUnfollow) {
      return res.status(400).send({
        message: "owner id or following id is request"
      });
    }

    if (viewerId === idUnfollow) {
      return res.status(400).send({
        message: "owner ID and following ID is duplicate"
      });
    }

    // check id owner
    const userFound = await User.find({
      where: { id: viewerId }
    });

    if (userFound.length === 0) {
      return res.status(400).send({
        message: "user id not found"
      });
    }

    // check id follow
    const userFollowing = await User.find({
      where: { id: idUnfollow }
    });

    if (userFollowing.length === 0) {
      return res.status(400).send({
        message: "user id will following not found"
      });
    }

    await User.removeFromCollection(viewerId, "following", idUnfollow);

    // delete notification
    await Notifications.destroy({
      senderId: viewerId,
      receiverId: idUnfollow,
      typeNotification: NotificationTypes.NEW_FOLLOW
    });

    // reponse
    return res.status(200).send("You have unfollowed this account");
  },

  following: async (req, res) => {
    const id = req.query.id || undefined;
    const limit = parseInt(req.query.limit || 20);
    const page = parseInt(req.query.page || 1);

    //#region check valid
    if ((page - 1) * limit < 0) {
      return res.send({
        message: "page or limit not correct"
      });
    }

    if (!id) {
      return res.status(400).send({
        message: "id request"
      });
    }
    //#endregion

    // find list
    const userFound = await User.findOne({
      where: { id: id },
      select: ["id"]
    }).populate("following", {
      select: [
        "id",
        "fullName",
        "isNew",
        "isPrivate",
        "profilePictureUrl",
        "profilePicturePublicId",
        "username",
        "isVerified"
      ],
      skip: (page - 1) * limit,
      limit: limit
    });

    if (userFound === undefined) {
      return res.status(400).send({ message: "user id not found" });
    } else {
      if (userFound.following.length > 0) {
        userFound.following = userFound.following.map((item, idx) => {
          const relationship = {
            blockedByViewer: {
              state: "BLOCK_STATUS_UNBLOCKED",
              stable: true
            },
            hasBlockedViewer: {
              state: "BLOCK_STATUS_UNBLOCKED",
              stable: true
            },
            followedByViewer: {
              state: "FOLLOW_STATUS_FOLLOWING",
              stable: true
            },
            followsViewer: {
              state: null,
              stable: true
            }
          };
          return { user: item, relationship: relationship };
        });
      }

      const totalItems = await User.findOne({
        id: id
      }).populate("following");

      return res.status(200).send({
        data: userFound.following,
        totalItems: totalItems.following.length
      });
    }
  },
  usernameFollowing: async (req, res) => {
    const username = req.query.username || undefined;
    const viewerId = req.query.viewerId || undefined;
    const limit = parseInt(req.query.limit || 20);
    const page = parseInt(req.query.page || 1);

    //#region check valid
    if ((page - 1) * limit < 0) {
      return res.send({
        message: "page or limit not correct"
      });
    }

    if (!username) {
      return res.status(400).send({
        message: "username request"
      });
    }

    if (!viewerId) {
      return res.status(400).send({
        message: "viewer Id request"
      });
    }

    //#endregion

    // find list
    const userFound = await User.findOne({
      where: { username: username },
      select: ["id", "username", "fullName"]
    }).populate("following", {
      select: [
        "id",
        "fullName",
        "isNew",
        "isPrivate",
        "profilePictureUrl",
        "profilePicturePublicId",
        "username",
        "isVerified"
      ],
      skip: (page - 1) * limit,
      limit: limit
    });

    if (userFound === undefined) {
      return res.send({ message: "username not found" });
    } else {
      // counts follows
      const counts = await UserService.counts(userFound.id);

      if (userFound.following.length > 0) {
        // Check viewer ID
        const viewerFound = await User.findOne({ id: viewerId });
        if (viewerFound === undefined) {
          return res.send({ message: "viewer ID not found" });
        }

        // fetch following info
        const fetchFollowing = async () => {
          const fetchRelationship = userFound.following.map(
            async (item, idx) => {
              const relationship = await FollowService.relationship(
                item.id,
                viewerId
              );

              return { user: item, relationship: relationship };
            }
          );

          return Promise.all(fetchRelationship);
        };

        fetchFollowing().then(data => {
          return res.status(200).send({ data, totalItems: counts.followedBy });
        });
      } else {
        return res.status(200).send({ data: [], totalItems: 0 });
      }
    }
  },
  follower: async (req, res) => {
    const id = req.query.id || undefined;
    const limit = parseInt(req.query.limit || 20);
    const page = parseInt(req.query.page || 1);

    if ((page - 1) * limit < 0) {
      return res.status(400).send({
        message: "page or limit not correct"
      });
    }

    if (!id) {
      return res.status(400).send({
        message: "id request"
      });
    }

    // find list
    const userFound = await User.findOne({
      where: { id: id },
      select: ["id"]
    }).populate("follower", {
      select: [
        "id",
        "fullName",
        "isNew",
        "isPrivate",
        "profilePictureUrl",
        "profilePicturePublicId",
        "username",
        "isVerified"
      ],
      skip: (page - 1) * limit,
      limit: limit
    });

    if (userFound === undefined) {
      return res.status(400).send({ message: "user id not found" });
    } else {
      const totalItems = await User.findOne({
        id: id
      }).populate("follower");

      res.status(200).send({
        data: userFound.follower,
        totalItems: totalItems.follower.length
      });
    }
  },
  usernameFollowers: async (req, res) => {
    const username = req.query.username || undefined;
    const viewerId = req.query.viewerId || undefined;
    const limit = parseInt(req.query.limit || 20);
    const page = parseInt(req.query.page || 1);

    //#region check valid
    if ((page - 1) * limit < 0) {
      return res.send({
        message: "page or limit not correct"
      });
    }

    if (!username) {
      return res.status(400).send({
        message: "username request"
      });
    }

    if (!viewerId) {
      return res.status(400).send({
        message: "viewer Id request"
      });
    }

    //#endregion

    // find list
    const userFound = await User.findOne({
      where: { username: username },
      select: ["id", "username", "fullName"]
    }).populate("follower", {
      select: [
        "id",
        "fullName",
        "isNew",
        "isPrivate",
        "profilePictureUrl",
        "profilePicturePublicId",
        "username",
        "isVerified"
      ],
      skip: (page - 1) * limit,
      limit: limit
    });

    if (userFound === undefined) {
      return res.send({ message: "username not found" });
    } else {
      const counts = await UserService.counts(userFound.id);

      if (userFound.follower.length > 0) {
        // Check viewer ID
        const viewerFound = await User.findOne({ id: viewerId });
        if (viewerFound === undefined) {
          return res.send({ message: "viewer ID not found" });
        }

        // fetch follower info
        const fetchFollowers = async () => {
          const fetchRelationship = userFound.follower.map(
            async (item, idx) => {
              const relationship = await FollowService.relationship(
                item.id,
                viewerId
              );

              return { user: item, relationship: relationship };
            }
          );

          return Promise.all(fetchRelationship);
        };

        fetchFollowers().then(data => {
          return res.status(200).send({ data, totalItems: counts.followedBy });
        });
      } else {
        return res.status(200).send({ data: [], totalItems: 0 });
      }
    }
  },

  addFollowRequest: async (req, res) => {
    const viewerId = req.body.viewerId || undefined;
    const userId = req.body.userId || undefined;

    //#region Check valid
    if (!viewerId || !userId) {
      return res.status(400).send({
        message: "id or id following request"
      });
    }

    if (viewerId === userId) {
      return res.status(400).send({
        message: "viewer id and user id following is duplicate"
      });
    }

    // check id owner
    const userOwner = await User.findOne({
      where: { id: viewerId }
    });

    if (userOwner === undefined) {
      return res.status(400).send({
        message: "viewer Id id not found"
      });
    }

    // check id follow
    const userFollowingRequest = await User.findOne({
      where: { id: userId }
    });

    if (userFollowingRequest === undefined) {
      return res.status(400).send({
        message: "user id will following not found"
      });
    }
    //#endregion

    const followFound = await User.findOne({
      where: { id: viewerId }
    }).populate("followingRequest", {
      where: { id: userId }
    });

    if (followFound.followingRequest.length) {
      return res.status(400).send({ message: "owner id follow requested" });
    } else {
      await User.addToCollection(viewerId, "followingRequest", userId);
    }

    // create notification
    const token = _.get(userFollowingRequest, "notificationToken") || "";
    const title = "New follow request";
    const body = `Username @${userFollowingRequest.username} has requested follow you`;
    const link = `/${userOwner.username}`;

    await Notifications.create({
      senderId: viewerId,
      receiverId: userId,
      typeNotification: NotificationTypes.NEW_FOLLOW,
      read: false
    });

    if (token) {
      await FcmService.sendNotification(token, title, body, link);
    }

    // response
    return res
      .status(200)
      .send({ message: "You have already follow requested this user" });
  },
  unfollowRequest: async (req, res) => {
    const viewerId = req.body.viewerId;
    const ownerId = req.body.userId;

    if (!viewerId || !ownerId) {
      return res.status(400).send({
        message: "owner id or following id is request"
      });
    }

    if (viewerId === ownerId) {
      return res.status(400).send({
        message: "owner ID and following ID is duplicate"
      });
    }

    // check id owner
    const userFound = await User.find({
      where: { id: viewerId }
    });

    if (userFound.length === 0) {
      return res.status(400).send({
        message: "viewer id not found"
      });
    }

    // check id follow
    const userFollowing = await User.find({
      where: { id: ownerId }
    });

    if (userFollowing.length === 0) {
      return res.status(400).send({
        message: "user id will not found"
      });
    }

    await User.removeFromCollection(viewerId, "followingRequest", ownerId);

    // delete notification
    await Notifications.destroy({
      senderId: viewerId,
      receiverId: ownerId,
      typeNotification: NotificationTypes.NEW_FOLLOW
    });

    // reponse
    return res
      .status(200)
      .send({ message: "You have cancel follow request this user" });
  },
  followRequests: async (req, res) => {
    const id = req.query.id || undefined;
    const limit = parseInt(req.query.limit || 20);
    const page = parseInt(req.query.page || 1);

    //#region check valid
    if ((page - 1) * limit < 0) {
      return res.status(400).send({
        message: "page or limit not correct"
      });
    }

    if (!id) {
      return res.status(400).send({
        message: "id request"
      });
    }
    //#endregion

    // find list
    const followRequests = await User.findOne({
      where: { id: id },
      select: ["id"]
    }).populate("followingRequest", {
      select: [
        "id",
        "fullName",
        "isNew",
        "isPrivate",
        "profilePictureUrl",
        "profilePicturePublicId",
        "username",
        "isVerified"
      ],
      skip: (page - 1) * limit,
      limit: limit
    });

    if (followRequests === undefined) {
      return res.status(400).send({ message: "user id not found" });
    } else {
      if (followRequests.followingRequest.length > 0) {
        followRequests.followingRequest = followRequests.followingRequest.map(
          (item, idx) => {
            const relationship = {
              blockedByViewer: {
                state: null,
                stable: true
              },
              hasBlockedViewer: {
                state: null,
                stable: true
              },
              followedByViewer: {
                state: "FOLLOW_STATUS_PRIVATE_REQUESTED",
                stable: true
              },
              followsViewer: {
                state: null,
                stable: true
              },
              restrictedByViewer: {
                stable: true,
                state: "RESTRICT_STATUS_UNRESTRICTED"
              }
            };

            return { user: item, relationship: relationship };
          }
        );
      }

      const totalItems = await User.findOne({ id: id }).populate(
        "followingRequest"
      );

      return res.status(200).send({
        data: followRequests.followingRequest,
        totalItems: totalItems.length
      });
    }
  },
  followerRequests: async (req, res) => {
    const id = req.query.id || undefined;
    const limit = parseInt(req.query.limit || 20);
    const page = parseInt(req.query.page || 1);

    if ((page - 1) * limit < 0) {
      return res.status(400).send({
        message: "page or limit not correct"
      });
    }

    if (!id) {
      return res.status(400).send({
        message: "id request"
      });
    }

    // find list
    const userFound = await User.findOne({
      where: { id: id },
      select: ["id"]
    }).populate("followerRequest", {
      select: [
        "id",
        "fullName",
        "isNew",
        "isPrivate",
        "profilePictureUrl",
        "profilePicturePublicId",
        "username",
        "isVerified"
      ],
      skip: (page - 1) * limit,
      limit: limit
    });

    if (userFound === undefined) {
      return res.status(400).send({ message: "user id not found" });
    } else {
      const totalItems = await User.findOne({
        id: id
      }).populate("followerRequest");

      return res.status(200).send({
        data: userFound.followerRequest,
        totalItems: totalItems.followerRequest.length
      });
    }
  },
  approveFollow: async (req, res) => {
    const viewerId = req.body.viewerId || undefined;
    const ownerId = req.body.userId || undefined;

    if (!viewerId || !ownerId) {
      return res.status(400).send({
        message: "owner id or following id is request"
      });
    }

    if (viewerId === ownerId) {
      return res.status(400).send({
        message: "owner ID and following ID is duplicate"
      });
    }

    // check id owner
    const viewerFound = await User.find({
      where: { id: viewerId }
    }).populate("followingRequest", {
      where: { id: ownerId }
    });

    if (!viewerFound.length) {
      return res.status(400).send({
        message: "viewer id not found"
      });
    }

    if (_.get(viewerFound, "[0].followingRequest", []).length === 0) {
      return res
        .status(400)
        .send({ message: "user have no follow requested for you" });
    }

    // check id follow
    const ownerFound = await User.find({
      where: { id: ownerId }
    });

    if (!ownerFound) {
      return res.status(400).send({
        message: "user id will not found"
      });
    }

    // start following
    await User.removeFromCollection(viewerId, "followingRequest", ownerId);
    await User.addToCollection(viewerId, "following", ownerId);

    // notification: send to follower
    const token = _.get(viewerFound, "notificationToken", "");
    const title = "New following";
    const body = `Username @${ownerFound.username} accepted your follow request`;
    const link = `/${ownerFound.username}`;

    await Notifications.create({
      senderId: ownerId,
      receiverId: viewerId,
      typeNotification: NotificationTypes.NEW_FOLLOW,
      read: false
    });

    if (token) {
      await FcmService.sendNotification(token, title, body, link);
    }

    // response
    return res.status(200).send({ message: "You approved follow request" });
  },
  denyFollow: async (req, res) => {
    const viewerId = req.body.viewerId || undefined;
    const ownerId = req.body.userId || undefined;

    if (!viewerId || !ownerId) {
      return res.status(400).send({
        message: "owner id or user id is request"
      });
    }

    if (viewerId === ownerId) {
      return res.status(400).send({
        message: "owner ID and following ID is duplicate"
      });
    }

    // check id owner
    const viewerFound = await User.find({
      where: { id: viewerId }
    });

    if (viewerFound.length === 0) {
      return res.status(400).send({
        message: "viewer id not found"
      });
    }

    // check id follow
    const ownerFound = await User.find({
      where: { id: ownerId }
    });

    if (ownerFound.length === 0) {
      return res.status(400).send({
        message: "user id will not found"
      });
    }

    //
    await User.removeFromCollection(viewerId, "followingRequest", ownerId);

    // response
    return res.status(200).send({ message: "You have deny follow request" });
  }
};
