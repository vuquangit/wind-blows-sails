var bcrypt = require("bcryptjs");

module.exports = {
  userIdInfo: async (req, res) => {
    const userId = req.params.id || undefined;

    if (!userId) {
      return res.status(401).send({ message: "User id is request" });
    }

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
        "profilePicturePublicId",
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

    if (!username) {
      return res.status(401).send({ message: "User name is request" });
    }

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
        "profilePicturePublicId",
        "username",
        "website",
        "isVerified",
        "phoneNumber"
      ]
    });

    if (userFound !== undefined) {
      // counts of user
      const counts = await UserService.counts(userFound.id);

      if (viewerId !== undefined) {
        const relationship = await FollowService.relationship(
          userFound.id,
          viewerId
        );

        return res.status(200).send({
          user: { ...userFound, counts },
          relationship: relationship
        });
      } else {
        return res.status(200).send({ user: { ...userFound, counts } });
      }
    } else {
      return res.status(401).send({ message: "User name not found" });
    }
  },
  updateInfoUser: async (req, res) => {
    const userParams = {
      id: req.body.id || undefined,
      email: req.body.email || undefined,
      username: req.body.username || undefined,
      fullName: req.body.fullName || "",
      bio: req.body.bio || "",
      phoneNumber: req.body.phoneNumber || "",
      website: req.body.website || "",
      gender: req.body.gender || ""
    };

    if (!userParams.id)
      return res.status(401).send({ message: "ID user required." });

    const updatedUser = await User.updateOne({ id: userParams.id }).set(
      userParams
    );

    if (updatedUser) {
      return res.status(200).send({ message: "profile has updated" });
    } else {
      return res
        .status(403)
        .send({ message: "The database does not contain a user id" });
    }
  },
  changePassword: async (req, res) => {
    const userId = req.body.userId || undefined;
    const oldPassword = req.body.oldPassword || undefined;
    const newPassword = req.body.newPassword || undefined;

    if (!userId) return res.status(401).send({ message: "ID user required." });

    if (!oldPassword)
      return res.status(401).send({ message: "Old password required." });

    if (!newPassword)
      return res.status(401).send({ message: "New password required." });

    // check old password correct
    userFound = await User.findOne({
      id: userId
    });

    if (!userFound)
      return res
        .status(403)
        .send({ message: "The database does not contain a user id" });

    // have a password
    if (userFound.isAuthenticateLogin) {
      const passValid = await bcrypt.compare(oldPassword, userFound.password);

      if (!passValid)
        return res.status(401).send({
          message:
            "Sorry, your password was incorrect. Please double-check your password."
        });
    }

    // change password
    await User.updateOne({ id: userId }).set({
      password: newPassword,
      isAuthenticateLogin: false
    });
    return res.status(200).send({ message: "Your password changed" });
  },
  changeProfilePicture: async (req, res) => {
    const userId = req.body.userId || undefined;
    const profilePictureUrl = req.body.profilePictureUrl || undefined;
    const profilePicturePublicId = req.body.profilePicturePublicId || undefined;

    if (_.isUndefined(req.param("userId"))) {
      return res.status(401).send({ message: "userId required." });
    }

    if (_.isUndefined(req.param("profilePictureUrl"))) {
      return res.status(401).send({ message: "profilePictureUrl required." });
    }

    if (_.isUndefined(req.param("profilePicturePublicId"))) {
      return res
        .status(401)
        .send({ message: "profilePicturePublicId required." });
    }

    const updatedUser = await User.updateOne({ id: userId }).set({
      profilePictureUrl: profilePictureUrl ? profilePictureUrl : "",
      profilePicturePublicId: profilePicturePublicId
        ? profilePicturePublicId
        : ""
    });

    if (updatedUser) {
      return res.status(200).send({ message: "profile photo has changed " });
    } else {
      return res
        .status(403)
        .send({ message: "The database does not contain this user id" });
    }
  },
  deactivationUser: async (req, res) => {
    const userId = req.params.userId || undefined;

    if (_.isUndefined(req.param("userId"))) {
      return res.status(401).send({ message: "userId required." });
    }

    const updatedUser = await User.updateOne({ id: userId }).set({
      disabledAccount: true
    });

    if (updatedUser) {
      return res.status(200).send({ message: "User has deactivation" });
    } else {
      return res.status(403).send({
        message: `The database does not contain this user id: ${userId}`
      });
    }
  },
  reactivatingUser: async (req, res) => {
    const userId = req.params.userId || undefined;

    if (_.isUndefined(req.param("userId"))) {
      return res.status(401).send({ message: "userId required." });
    }

    const updatedUser = await User.updateOne({ id: userId }).set({
      disabledAccount: false
    });

    if (updatedUser) {
      return res.status(200).send({ message: "User has reactive" });
    } else {
      return res.status(403).send({
        message: `The database does not contain this user id: ${userId}`
      });
    }
  },

  saveNotificationToken: async (req, res) => {
    const notiToken = req.body.token || undefined;
    const userId = req.body.userId || undefined;

    if (!userId)
      return res.status(401).send({
        message: "user id required"
      });

    if (!notiToken)
      return res.status(401).send({
        message: "notification token required"
      });

    const userUpdated = await User.updateOne({ id: userId }).set({
      notificationToken: notiToken
    });

    if (userUpdated) {
      return res.status(200).send(userUpdated);
      // return res.status(200).send({message: "token is saved"})
    } else {
      return res.status(401).send({
        message: `The database does not contain a user id: ${userId}`
      });
    }
  },
  deleteNotificationToken: async (req, res) => {
    const userId = req.body.userId;

    if (!userId)
      return res.status(401).send({
        message: "user id required"
      });

    const userUpdated = await User.updateOne({ id: userId }).set({
      notificationToken: ""
    });

    if (userUpdated) {
      return res.status(200).send(userUpdated);
      // return res.status(200).send({message: "token is delete"})
    } else {
      return res.status(401).send({
        message: `The database does not contain a user id: ${userId}`
      });
    }
  }
};
