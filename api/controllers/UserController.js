var bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

module.exports = {
  userIdInfo: async (req, res) => {
    const userId = req.params.id || undefined;

    if (!userId) {
      return res.status(400).send({ message: "User id is request" });
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
    })
      .catch({ name: "UsageError" }, err => {
        return res.badRequest(err);
      })
      .catch(err => {
        return res.serverError(err);
      });

    if (userFound) {
      // counts of user
      const counts = await UserService.counts(userId);

      return res.status(200).send({ ...userFound, counts });
    } else {
      return res.status(400).send({ message: "User id not found" });
    }
  },
  userNameInfo: async (req, res) => {
    const username = req.body.username || undefined;
    const viewerId = req.body.viewerId || undefined;

    if (!username) {
      return res.status(400).send({ message: "User name is request" });
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
    })
      .catch({ name: "UsageError" }, err => {
        return res.badRequest(err);
      })
      .catch(err => {
        return res.serverError(err);
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
      return res.status(400).send({ message: "User name not found" });
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

    if (!userParams.id) {
      return res.status(400).send({ message: "ID user required." });
    }

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
    const isConfirmOldPassword = req.body.isConfirmOldPassword || undefined;

    if (!userId) {
      return res.status(400).send({ message: "ID user required." });
    }

    if (!newPassword) {
      return res.status(400).send({ message: "Password required." });
    }

    // check old password correct
    userFound = await User.findOne({
      id: userId
    });

    if (!userFound) {
      return res
        .status(403)
        .send({ message: "The database does not contain a user id" });
    }

    // have a password
    if (isConfirmOldPassword) {
      if (!oldPassword) {
        return res.status(400).send({ message: "Old password required." });
      }

      const passValid = await bcrypt.compare(oldPassword, userFound.password);

      if (!passValid) {
        return res.status(400).send({
          message:
            "Sorry, your password was incorrect. Please double-check your password."
        });
      }
    }

    // change password
    await User.updateOne({ id: userId }).set({
      password: newPassword,
      isAuthenticateLogin: false,
      resetPasswordToken: "",
      resetPasswordExpires: Date.now() - 3600000
    });

    return res.status(200).send({ message: "Your password changed" });
  },
  changeProfilePicture: async (req, res) => {
    const userId = req.body.userId || undefined;
    const profilePictureUrl = req.body.profilePictureUrl || undefined;
    const profilePicturePublicId = req.body.profilePicturePublicId || undefined;

    if (_.isUndefined(req.param("userId"))) {
      return res.status(400).send({ message: "userId required." });
    }

    if (_.isUndefined(req.param("profilePictureUrl"))) {
      return res.status(400).send({ message: "profilePictureUrl required." });
    }

    if (_.isUndefined(req.param("profilePicturePublicId"))) {
      return res
        .status(400)
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

  forgotPassword: async (req, res) => {
    const email = req.body.email || undefined;
    const localhost = req.body.localhost || undefined;

    if (!email) {
      return res.status(400).send({ message: "email required." });
    }
    if (!localhost) {
      return res.status(400).send({ message: "localhost URL required." });
    }

    const userFound = await User.findOne({ email: email });
    if (!userFound) {
      return res.status(403).send({ message: "email not in database" });
    } else {
      // const token = jwt.sign({ user: user.id }, process.env.JWT_SECRET, {
      //   expiresIn: 3600
      // });
      const token = crypto.randomBytes(50).toString("hex");

      await User.updateOne({ email: email }).set({
        resetPasswordToken: token,
        resetPasswordExpires: Date.now() + 3600000
      });

      const mailServer = process.env.MAIL_SERVER;
      const mailPass = process.env.MAIL_PASS;

      const transporter = await nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: mailServer,
          pass: mailPass
        }
      });

      const mailOptions = {
        from: `The Wind Blows <${mailServer}>`,
        to: email,
        subject: "Link To Reset Password",
        html: `<p style="font-size: 16px;">Please click to reset password</p>
        <br />
        ${localhost}${
          _.endsWith(localhost, "/") ? "" : "/"
        }accounts/password/reset/${token}<br /><br />
        `
      };

      // returning result
      transporter.sendMail(mailOptions, (erro, response) => {
        if (erro) {
          return res.status(403).send(erro.toString());
        }

        return res.send("Sended");
      });
    }
  },
  resetPassword: async (req, res) => {
    const resetPasswordToken = req.query.resetPasswordToken || undefined;

    if (!resetPasswordToken) {
      return res.status(400).send({ message: "reset password token request" });
    }

    const userFound = await User.findOne({
      resetPasswordToken: resetPasswordToken,
      resetPasswordExpires: {
        ">=": Date.now()
      }
    });

    if (!userFound) {
      return res
        .status(400)
        .send({ message: "password reset link is invalid or has expried" });
    } else {
      return res.status(200).send(userFound);
    }
  },

  saveNotificationToken: async (req, res) => {
    const notiToken = req.body.token || undefined;
    const userId = req.body.userId || undefined;

    if (!userId) {
      return res.status(400).send({
        message: "user id required"
      });
    }

    if (!notiToken) {
      return res.status(400).send({
        message: "notification token required"
      });
    }

    const userUpdated = await User.updateOne({ id: userId }).set({
      notificationToken: notiToken
    });

    if (userUpdated) {
      return res.status(200).send(userUpdated);
      // return res.status(200).send({message: "token is saved"})
    } else {
      return res.status(400).send({
        message: `The database does not contain a user id: ${userId}`
      });
    }
  },
  deleteNotificationToken: async (req, res) => {
    const userId = req.body.userId;

    if (!userId) {
      return res.status(400).send({
        message: "user id required"
      });
    }

    const userUpdated = await User.updateOne({ id: userId }).set({
      notificationToken: ""
    });

    if (userUpdated) {
      return res.status(200).send(userUpdated);
      // return res.status(200).send({message: "token is delete"})
    } else {
      return res.status(400).send({
        message: `The database does not contain a user id: ${userId}`
      });
    }
  },

  deactivationUser: async (req, res) => {
    const userId = req.params.userId || undefined;

    if (_.isUndefined(req.param("userId"))) {
      return res.status(400).send({ message: "userId required." });
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
      return res.status(400).send({ message: "userId required." });
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
  }
};
