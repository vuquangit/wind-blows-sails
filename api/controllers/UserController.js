module.exports = {
  posts: async (req, res) => {
    const userId = req.query.id || undefined;
    const limit = parseInt(req.query.limit || 20);
    const page = parseInt(req.query.page || 1);

    if ((page - 1) * limit < 0) {
      return res.send({
        message: "page or limit not correct"
      });
    }

    if (!userId) return res.status(401).send({ message: "User id is request" });

    const postFound = await User.findOne({
      where: { id: userId },
      select: ["username", "isVerified"]
    }).populate("postId", {
      skip: (page - 1) * limit,
      limit: limit,
      sort: "createdAt DESC"
    });
    if (postFound !== undefined) return res.send(postFound);
    else res.status(401).send({ message: "User id not found" });
  },
  userIdInfo: async (req, res) => {
    const userId = req.params.id || undefined;

    if (!userId) return res.status(401).send({ message: "User id is request" });

    const userFound = await User.findOne({
      where: { id: userId },
      select: [
        "id",
        "bio",
        "fullName",
        "email",
        "isNew",
        "isPrivate",
        "profilePictureUrl",
        "profilePictureUrlHd",
        "username",
        "website",
        "isVerified"
      ]
    });

    if (userFound !== undefined) {
      // counts of user
      const counts = await UserService.counts(userFound.id);

      return res.status(200).send({ ...userFound, counts });
    } else {
      return res.status(401).send({ message: "User id not found" });
    }
  },
  userNameInfo: async (req, res) => {
    const username = req.body.username || undefined;
    const viewerId = req.body.viewerId || undefined;

    if (!username)
      return res.status(401).send({ message: "User name is request" });

    const userFound = await User.findOne({
      where: { username: username },
      select: [
        "id",
        "bio",
        "fullName",
        "email",
        "isNew",
        "isPrivate",
        "profilePictureUrl",
        "profilePictureUrlHd",
        "username",
        "website",
        "isVerified"
      ]
    });

    if (userFound !== undefined) {
      // counts of user
      const counts = await UserService.counts(userFound.id);

      if (viewerId !== undefined && viewerId !== userFound.id) {
        const relationship = await FollowService.relationship(
          userFound.id,
          viewerId
        );

        return res
          .status(200)
          .send({ user: { ...userFound, counts }, relationship: relationship });
      } else return res.status(200).send({ user: { ...userFound, counts } });
    } else {
      return res.status(401).send({ message: "User name not found" });
    }
  }
};
