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
      return res.status(400).send({ message: "User id is request" });
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
      return res.status(400).send({ message: "User id not found" });
    } else {
      const totalItem = await User.findOne({ id: userId })
        .populate("notifications")
        .populate("followerRequest");

      const totalUnread = await User.findOne({
        id: userId
      }).populate("notifications", {
        where: { read: false }
      });

      const notifications = () => {
        const notification = UserFound.notifications.map(async item => {
          const user = await User.findOne({
            where: { id: item.senderId },
            select: [
              "id",
              "username",
              "fullName",
              "profilePictureUrl",
              "profilePicturePublicId",
              "isPrivate"
            ]
          });

          const media = await Posts.findOne({
            where: { id: item.postId },
            select: ["id", "sidecarChildren"]
          });

          const relationship = await FollowService.relationship(
            item.senderId,
            item.receiverId
          );

          return {
            id: item.id,
            media: media,
            text: item.text,
            timestamp: item.createdAt,
            typeNotification: item.typeNotification,
            user: {
              ...user,
              relationship: relationship,
              requestedByViewer: false
            },
            read: item.read
          };
        });

        return Promise.all(notification);
      };

      notifications().then(notifications => {
        return res.status(200).send({
          data: notifications,
          totalItem: totalItem.notifications.length,
          totalUnread: totalUnread.notifications.length,
          totalFollowRequests: totalItem.followerRequest.length
        });
      });
    }
  },
  totalUnread: async (req, res) => {
    const userId = req.body.userId || undefined;

    if (!userId) {
      return res.status(400).send({ message: "User id is request" });
    }

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
      return res.status(400).send({ message: "User id not found" });
    } else {
      return res
        .status(200)
        .send({ totalUnread: UserFound.notifications.length });
    }
  },
  readNotification: async (req, res) => {
    const id = req.body.id || undefined;
    if (!id) {
      return res.status(400).send({ message: "id request" });
    }

    const NotiUpdated = await Notifications.updateOne({ id: id })
      .set({
        read: true
      })
      .catch({ name: "UsageError" }, err => {
        return res.badRequest(err);
      })
      .catch(err => {
        return res.serverError(err);
      });

    if (NotiUpdated) {
      return res.status(200).send(NotiUpdated);
    } else {
      return res.status(400).send({ message: "id notification not found" });
    }
  },
  readAllNotification: async (req, res) => {
    const userId = req.body.userId || undefined;

    if (!userId) {
      return res.status(400).send({ message: "user id request" });
    }

    const NotiUpdated = await Notifications.update({
      receiverId: userId
    })
      .set({
        read: true
      })
      .fetch()
      .catch({ name: "UsageError" }, err => {
        return res.badRequest(err);
      })
      .catch(err => {
        return res.serverError(err);
      });

    if (NotiUpdated) {
      return res.status(200).send(NotiUpdated);
    } else {
      return res.status(400).send({ message: "user id not found" });
    }
  }
};
