module.exports = {
  addFollow: async (req, res) => {
    const viewerId = req.body ? req.body.viewerId : undefined;
    const userId = req.body ? req.body.userId : undefined;

    //#region Check valid
    if (!viewerId || !userId)
      return res.status(400).send({
        message: "id or id following request"
      });

    if (viewerId === userId)
      return res.status(400).send({
        message: "id and id following is duplicate"
      });

    // check id owner
    const userOwner = await User.findOne({
      where: { id: viewerId }
    });

    if (userOwner === undefined)
      return res.status(400).send({
        message: "owner id not found"
      });

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

    if (followFound.following.length)
      return res.status(400).send({ message: "owner id adready following" });
    else await User.addToCollection(viewerId, "following", userId);

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

    if (token) await FcmService.sendNotification(token, title, body, link);

    // response
    return res.status(200).send("You have already followed this account");
  },
  unfollow: async (req, res) => {
    const viewerId = req.body.viewerId;
    const idUnfollow = req.body.userId;

    if (!viewerId || !idUnfollow)
      return res.status(400).send({
        message: "owner id or following id is request"
      });

    if (viewerId === idUnfollow)
      return res.status(400).send({
        message: "owner ID and following ID is duplicate"
      });

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

    if (userFollowing.length === 0)
      return res.status(400).send({
        message: "user id will following not found"
      });

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
    const follows = await User.findOne({
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

    if (follows === undefined)
      return res.send({ message: "user id not found" });
    else {
      if (follows.following.length > 0) {
        follows.following = follows.following.map((item, idx) => {
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

      res.status(200).send(follows);
    }
  },
  usernameFollowing: async (req, res) => {
    const username = req.query.username || undefined;
    const viewerId = req.query.viewerId || undefined;
    const limit = parseInt(req.query.limit || 20);
    const page = parseInt(req.query.page || 1);

    //#region check valid
    if ((page - 1) * limit < 0)
      return res.send({
        message: "page or limit not correct"
      });

    if (!username)
      return res.status(400).send({
        message: "username request"
      });

    if (!viewerId)
      return res.status(400).send({
        message: "viewer Id request"
      });

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

    if (userFound === undefined)
      return res.send({ message: "username not found" });
    else {
      // counts follows
      const counts = await UserService.counts(userFound.id);

      if (userFound.following.length > 0) {
        // Check viewer ID
        const viewerFound = await User.findOne({ id: viewerId });
        if (viewerFound === undefined)
          return res.send({ message: "viewer ID not found" });

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

        fetchFollowing().then(following => {
          return res.status(200).send({ ...userFound, counts, following });
        });
      } else return res.status(200).send({ ...userFound, counts });
    }
  },
  follower: async (req, res) => {
    const id = req.query.id || undefined;
    const limit = parseInt(req.query.limit || 20);
    const page = parseInt(req.query.page || 1);

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

    const userFound = await User.findOne({
      where: { id: id }
    });

    if (userFound === undefined) {
      return res.send({
        message: "owner id not found"
      });
    }

    // find list
    const followingList = await User.findOne({
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
    if (followingList === undefined) return res.send({});
    else res.status(200).send(followingList);
  },
  usernameFollowers: async (req, res) => {
    const username = req.query.username || undefined;
    const viewerId = req.query.viewerId || undefined;
    const limit = parseInt(req.query.limit || 20);
    const page = parseInt(req.query.page || 1);

    //#region check valid
    if ((page - 1) * limit < 0)
      return res.send({
        message: "page or limit not correct"
      });

    if (!username)
      return res.status(400).send({
        message: "username request"
      });

    if (!viewerId)
      return res.status(400).send({
        message: "viewer Id request"
      });

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

    if (userFound === undefined)
      return res.send({ message: "username not found" });
    else {
      const counts = await UserService.counts(userFound.id);

      if (userFound.follower.length > 0) {
        // Check viewer ID
        const viewerFound = await User.findOne({ id: viewerId });
        if (viewerFound === undefined)
          return res.send({ message: "viewer ID not found" });

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

        fetchFollowers().then(follower => {
          return res.status(200).send({ ...userFound, counts, follower });
        });
      } else return res.status(200).send({ ...userFound, counts });
    }
  }
};
