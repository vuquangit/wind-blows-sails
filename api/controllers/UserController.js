module.exports = {
  addFollow: async (req, res) => {
    const idOnwer = req.body ? req.body.id : undefined;
    const idFollowing = req.body ? req.body.idFollowing : undefined;

    if (!idOnwer || !idFollowing) {
      return res.status(401).send({
        message: "id or id following request"
      });
    }

    if (idOnwer === idFollowing) {
      return res.send({
        message: "id and id following is duplicate"
      });
    }

    // check id owner
    const userFound = await User.find({
      where: { id: idOnwer },
      select: ["following"]
    });

    if (userFound.length === 0) {
      return res.send({
        message: "user id not found"
      });
    }

    // check id follow
    const userFollowing = await User.find({
      where: { id: idFollowing },
      select: ["follower"]
    });

    if (userFollowing.length === 0) {
      return res.send({
        message: "user id will following not found"
      });
    }

    // List following before
    const strFollowing = userFound[0].following;
    const newFollowing = await (strFollowing
      .split(",")
      .find(x => x === idFollowing) === undefined
      ? strFollowing.concat(!!strFollowing ? "," : "").concat(idFollowing)
      : strFollowing);

    if (newFollowing.length === strFollowing.length) {
      return res.send({
        message: "id will follow has following"
      });
    }

    // Update following
    await User.updateOne({ id: idOnwer })
      .set({
        following: newFollowing
      })
      .exec((err, updated) => {
        if (err) {
          return res.serverError(err);
        }

        // Add follower of id following
        const addFolower = async () => {
          const strFollower = userFollowing[0].follower;
          const newFollower = await (strFollower
            .split(",")
            .find(x => x === idOnwer) === undefined
            ? strFollower.concat(!!strFollower ? "," : "").concat(idOnwer)
            : strFollower);

          // Update follower
          await User.updateOne({ id: idFollowing }).set({
            follower: newFollower
          });
        };

        addFolower().then(res.send(updated));
      });
  },
  unfollow: async (req, res) => {
    const idOnwer = req.body.id;
    const idUnfollow = req.body.idUnfollow;

    if (!idOnwer || !idUnfollow) {
      return res.status(401).send({
        message: "id or id following request"
      });
    }

    if (idOnwer === idUnfollow) {
      return res.send({
        message: "id and id following is duplicate"
      });
    }

    // check id owner
    const userFound = await User.find({
      where: { id: idOnwer },
      select: ["following"]
    });

    if (userFound.length === 0) {
      return res.send({
        message: "user id not found"
      });
    }

    // check id follow
    const userFollowing = await User.find({
      where: { id: idUnfollow },
      select: ["follower"]
    });

    if (userFollowing.length === 0) {
      return res.send({
        message: "user id will following not found"
      });
    }

    // List following before
    const strFollowing = userFound[0].following;
    const newFollowing = await strFollowing
      .replace(idUnfollow, "")
      .replace(",,", ",");

    if (newFollowing.length === strFollowing.length) {
      return res.send({
        message: "you do not have follow this id"
      });
    }

    // Update following
    await User.updateOne({ id: idOnwer })
      .set({
        following: newFollowing
      })
      .exec((err, updated) => {
        if (err) {
          return res.serverError(err);
        }

        // Add follower of id following
        const updateFolower = async () => {
          const strFollower = userFollowing[0].follower;
          const newFollower = await strFollower
            .replace(idOnwer, "")
            .replace(",,", ",");

          // Update follower
          await User.updateOne({ id: idUnfollow }).set({
            follower: newFollower
          });
        };

        updateFolower().then(res.send(updated));
      });
  },
  following: async (req, res) => {
    const id = req.body.id;
    const limit = parseInt(req.query.limit || 20);
    const page = parseInt(req.query.page || 1);

    if ((page - 1) * limit < 0) {
      return res.send({
        message: "page or limit not correct"
      });
    }

    if (!id) {
      return res.status(401).send({
        message: "id request"
      });
    }

    const userFound = await User.find({
      where: { id: id },
      select: ["following", "blocked"]
    });

    if (userFound === undefined) {
      return res.notFound({
        message: "viewer id not found"
      });
    }

    const fetchUserInfo = async (followingOfViewer, blockedOfViewer) => {
      const result = followingOfViewer.map(async item => {
        const dataFound = await User.find({
          where: { id: item },
          select: [
            "id",
            "fullName",
            "isNew",
            "isPrivate",
            "profilePictureUrl",
            "username",
            "isVerified",
            "following",
            "blocked"
          ]
        });

        if (dataFound !== undefined && dataFound.length > 0) {
          const { following, blocked, ...userData } = dataFound[0];
          const ownerFollowing = !!following ? following.split(",") : [];
          const ownerBlocked = !!blocked ? blocked.split(",") : [];

          return {
            user: userData,
            relationship: {
              blockedByViewer: {
                state:
                  blockedOfViewer.indexOf(item) === -1
                    ? "BLOCK_STATUS_UNBLOCKED"
                    : "BLOCK_STATUS_BLOCKED",
                stable: true
              },
              hasBlockedViewer: {
                state:
                  ownerBlocked.indexOf(id) === -1
                    ? "BLOCK_STATUS_UNBLOCKED"
                    : "BLOCK_STATUS_BLOCKED",
                stable: true
              },
              followedByViewer: {
                state:
                  followingOfViewer.indexOf(item) !== -1
                    ? "FOLLOW_STATUS_FOLLOWING"
                    : "FOLLOW_STATUS_NOT_FOLLOWING",
                stable: true
              },
              followsViewer: {
                state:
                  ownerFollowing.indexOf(id) !== -1
                    ? "FOLLOW_STATUS_FOLLOWING"
                    : "FOLLOW_STATUS_NOT_FOLLOWING",
                stable: true
              }
            }
          };
        } else {
          return { id: item, message: "id data not found" };
        }
      });

      return Promise.all(result);
    };

    const arrFollowing = !!userFound[0].following
      ? userFound[0].following.split(",")
      : [];
    const arrBlocked = !!userFound[0].blocked
      ? userFound[0].blocked.split(",")
      : [];

    arrFollowingPagi = arrFollowing.slice(
      (page - 1) * limit,
      (page - 1) * limit + limit
    );

    fetchUserInfo(arrFollowingPagi, arrBlocked).then(a => res.json(a));
  },
  follower: async (req, res) => {
    const id = req.body.id;
    const limit = parseInt(req.query.limit || 20);
    const page = parseInt(req.query.page || 1);

    if ((page - 1) * limit < 0) {
      return res.send({
        message: "page or limit not correct"
      });
    }

    if (!id) {
      return res.status(401).send({
        message: "id request"
      });
    }

    const userFound = await User.find({
      where: { id: id },
      select: ["follower", "following", "blocked"]
    });

    if (userFound === undefined) {
      return res.notFound({
        message: "viewer id not found"
      });
    }

    const fetchUserInfo = async (
      followerOfViewer,
      followingOfViewer,
      blockedOfViewer
    ) => {
      const result = followerOfViewer.map(async item => {
        const dataFound = await User.find({
          where: { id: item },
          select: [
            "id",
            "fullName",
            "isNew",
            "isPrivate",
            "profilePictureUrl",
            "username",
            "isVerified",
            "following",
            "blocked"
          ]
        });

        if (dataFound !== undefined && dataFound.length > 0) {
          const { following, blocked, ...userData } = dataFound[0];
          const ownerFollowing = !!following ? following.split(",") : [];
          const ownerBlocked = !!blocked ? blocked.split(",") : [];

          return {
            user: userData,
            relationship: {
              blockedByViewer: {
                state:
                  blockedOfViewer.indexOf(item) === -1
                    ? "BLOCK_STATUS_UNBLOCKED"
                    : "BLOCK_STATUS_BLOCKED",
                stable: true
              },
              hasBlockedViewer: {
                state:
                  ownerBlocked.indexOf(id) === -1
                    ? "BLOCK_STATUS_UNBLOCKED"
                    : "BLOCK_STATUS_BLOCKED",
                stable: true
              },
              followedByViewer: {
                state:
                  followingOfViewer.indexOf(item) !== -1
                    ? "FOLLOW_STATUS_FOLLOWING"
                    : "FOLLOW_STATUS_NOT_FOLLOWING",
                stable: true
              },
              followsViewer: {
                state:
                  ownerFollowing.indexOf(id) !== -1
                    ? "FOLLOW_STATUS_FOLLOWING"
                    : "FOLLOW_STATUS_NOT_FOLLOWING",
                stable: true
              }
            }
          };
        } else {
          return { id: item, message: "id data not found" };
        }
      });

      return Promise.all(result);
    };

    const arrFollower = !!userFound[0].follower
      ? userFound[0].follower.split(",")
      : [];
    const arrFollowing = !!userFound[0].following
      ? userFound[0].following.split(",")
      : [];
    const arrBlocked = !!userFound[0].blocked
      ? userFound[0].blocked.split(",")
      : [];

    arrFollowergPaginate = arrFollower.slice(
      (page - 1) * limit,
      (page - 1) * limit + limit
    );

    fetchUserInfo(arrFollowergPaginate, arrFollowing, arrBlocked).then(a =>
      res.json(a)
    );
  },

  posts: async (req, res) => {
    const postId = req.body.id;
    const limit = parseInt(req.query.limit || 20);
    const page = parseInt(req.query.page || 1);

    if ((page - 1) * limit < 0) {
      return res.send({
        message: "page or limit not correct"
      });
    }

    const postFound = await User.findOne({
      where: { id: postId },
      select: ["username", "isVerified"]
    }).populate("postId", {
      skip: (page - 1) * limit,
      limit: limit,
      sort: "createdAt DESC"
    });

    return res.send(postFound);
  }
};
