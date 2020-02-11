module.exports = {
  notifications: async (req, res) => {
    const userId = req.query.userId || undefined;
    const limit = parseInt(req.query.limit || 20);
    const page = parseInt(req.query.page || 1);

    if ((page - 1) * limit < 0) {
      return res.send({
        message: "page or limit not correct"
      });
    }

    if (!userId) {
      return res.status(401).send({ message: "User id is request" });
    }

    const UserFound = await User.findOne({
      where: { id: userId },
      select: [
        "id",
        "username",
        "isVerified",
        "fullName",
        "isPrivate",
        "profilePictureUrl",
        "profilePicturePublicId"
      ]
    })
      .populate("notifications", {
        skip: (page - 1) * limit,
        limit: limit,
        sort: "createdAt DESC"
      })
      .catch({ name: "UsageError" }, err => {
        return res.badRequest(err);
      })
      .catch(err => {
        return res.serverError(err);
      });

    if (UserFound === undefined) {
      return res.status(401).send({ message: "User id not found" });
    } else {
      const totalItem = await User.findOne({ id: userId }).populate(
        "notifications"
      );

      const totalUnread = await User.findOne({
        id: userId
      }).populate("notifications", {
        where: { read: false }
      });

      return res.status(200).send({
        data: UserFound.notifications,
        totalItem: totalItem.notifications.length,
        totalUnread: totalUnread.notifications.length
      });
    }
  },
  totalUnread: async (req, res) => {
    const userId = req.body.userId || undefined;

    if (!userId) return res.status(401).send({ message: "User id is request" });

    const UserFound = await User.findOne({
      id: userId
    })
      .populate("notifications", {
        where: { read: false }
      })
      .catch({ name: "UsageError" }, err => {
        return res.badRequest(err);
      })
      .catch(err => {
        return res.serverError(err);
      });

    if (UserFound === undefined) {
      return res.status(401).send({ message: "User id not found" });
    } else {
      return res
        .status(200)
        .send({ totalUnread: UserFound.notifications.length });
    }
  },
  infoNotification: async (req, res) => {
    return res.ok();
  }
};
