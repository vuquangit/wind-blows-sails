module.exports = {
  addFollow: async (req, res) => {
    const idOnwer = req.body ? req.body.id : undefined;
    const idFollowing = req.body ? req.body.idFollowing : undefined;

    //#region Check valid
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
    const userOwner = await User.findOne({
      where: { id: idOnwer }
    });

    if (userOwner === undefined) {
      return res.send({
        message: "owner id not found"
      });
    }

    // check id follow
    const userFollowing = await User.findOne({
      where: { id: idFollowing }
    });

    if (userFollowing === undefined) {
      return res.send({
        message: "user id will following not found"
      });
    }
    //#endregion

    const followFound = await User.findOne({
      where: { id: idOnwer }
    }).populate("following", {
      where: { id: idFollowing }
    });

    if (followFound.following.length)
      return res.send({ message: "owner id adready following" });
    else await User.addToCollection(idOnwer, "following", idFollowing);

    return res.status(200).send("Followed. Done");
  },
  unfollow: async (req, res) => {
    const idOnwer = req.body.id;
    const idUnfollow = req.body.idUnfollow;

    if (!idOnwer || !idUnfollow) {
      return res.status(401).send({
        message: "owner id or following id is request"
      });
    }

    if (idOnwer === idUnfollow) {
      return res.send({
        message: "owner ID and following ID is duplicate"
      });
    }

    // check id owner
    const userFound = await User.find({
      where: { id: idOnwer }
    });

    if (userFound.length === 0) {
      return res.send({
        message: "user id not found"
      });
    }

    // check id follow
    const userFollowing = await User.find({
      where: { id: idUnfollow }
    });

    if (userFollowing.length === 0) {
      return res.send({
        message: "user id will following not found"
      });
    }

    await User.removeFromCollection(idOnwer, "following", idUnfollow);

    return res.status(200).send("Unfollowed. Done");
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
      return res.status(401).send({
        message: "id request"
      });
    }

    const userFound = await User.findOne({
      where: { id: id }
    });

    if (userFound === undefined) {
      return res.send({
        message: "viewer id not found"
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
      return res.status(401).send({
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
        "username",
        "isVerified"
      ],
      skip: (page - 1) * limit,
      limit: limit
    });
    if (followingList === undefined) return res.send({});
    else res.status(200).send(followingList);
  }
};
