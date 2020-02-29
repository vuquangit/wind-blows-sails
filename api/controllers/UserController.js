var bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

module.exports = {
  userIdInfo: async (req, res) => {
    const userId = req.params.id || undefined;

    if (!userId) {
      return res.status(400).send({
        message: "User id is request"
      });
    }

    const userFound = await User.findOne({
      where: {
        id: userId
      },
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
      .catch(
        {
          name: "UsageError"
        },
        err => {
          return res.badRequest(err);
        }
      )
      .catch(err => {
        return res.serverError(err);
      });

    if (userFound) {
      // counts of user
      const counts = await UserService.counts(userId);

      return res.status(200).send({
        ...userFound,
        counts
      });
    } else {
      return res.status(400).send({
        message: "User id not found"
      });
    }
  },
  userNameInfo: async (req, res) => {
    const username = req.body.username || undefined;
    const viewerId = req.body.viewerId || undefined;

    if (!username) {
      return res.status(400).send({
        message: "User name is request"
      });
    }

    const userFound = await User.findOne({
      where: {
        username: username
      },
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
      .catch(
        {
          name: "UsageError"
        },
        err => {
          return res.badRequest(err);
        }
      )
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
          user: {
            ...userFound,
            counts
          },
          relationship: relationship
        });
      } else {
        return res.status(200).send({
          user: {
            ...userFound,
            counts
          }
        });
      }
    } else {
      return res.status(400).send({
        message: "User name not found"
      });
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
      return res.status(400).send({
        message: "ID user required."
      });
    }

    const updatedUser = await User.updateOne({
      id: userParams.id
    }).set(userParams);

    if (updatedUser) {
      return res.status(200).send({
        message: "profile has updated"
      });
    } else {
      return res.status(403).send({
        message: "The database does not contain a user id"
      });
    }
  },
  changePassword: async (req, res) => {
    const userId = req.body.userId || undefined;
    const oldPassword = req.body.oldPassword || undefined;
    const newPassword = req.body.newPassword || undefined;
    const isConfirmOldPassword = req.body.isConfirmOldPassword || undefined;

    if (!userId) {
      return res.status(400).send({
        message: "ID user required."
      });
    }

    if (!newPassword) {
      return res.status(400).send({
        message: "Password required."
      });
    }

    // check old password correct
    userFound = await User.findOne({
      id: userId
    });

    if (!userFound) {
      return res.status(403).send({
        message: "The database does not contain a user id"
      });
    }

    // have a password
    if (isConfirmOldPassword) {
      if (!oldPassword) {
        return res.status(400).send({
          message: "Old password required."
        });
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
    await User.updateOne({
      id: userId
    }).set({
      password: newPassword,
      isAuthenticateLogin: false,
      resetPasswordToken: "",
      resetPasswordExpires: Date.now() - 3600000
    });

    return res.status(200).send({
      message: "Your password changed"
    });
  },
  changeProfilePicture: async (req, res) => {
    const userId = req.body.userId || undefined;
    const profilePictureUrl = req.body.profilePictureUrl || undefined;
    const profilePicturePublicId = req.body.profilePicturePublicId || undefined;

    if (_.isUndefined(req.param("userId"))) {
      return res.status(400).send({
        message: "userId required."
      });
    }

    if (_.isUndefined(req.param("profilePictureUrl"))) {
      return res.status(400).send({
        message: "profilePictureUrl required."
      });
    }

    if (_.isUndefined(req.param("profilePicturePublicId"))) {
      return res.status(400).send({
        message: "profilePicturePublicId required."
      });
    }

    const updatedUser = await User.updateOne({
      id: userId
    }).set({
      profilePictureUrl: profilePictureUrl ? profilePictureUrl : "",
      profilePicturePublicId: profilePicturePublicId
        ? profilePicturePublicId
        : ""
    });

    if (updatedUser) {
      return res.status(200).send({
        message: "profile photo has changed "
      });
    } else {
      return res.status(403).send({
        message: "The database does not contain this user id"
      });
    }
  },
  changePrivateAccount: async (req, res) => {
    const userId = req.body.userId || undefined;
    const isPrivate = req.body.isPrivate;

    if (!userId) {
      return res.status(400).send({
        message: "ID user required."
      });
    }

    if (typeof isPrivate !== "boolean") {
      return res.status(400).send({
        message: "isPrivate required."
      });
    }

    const updatedUser = await User.updateOne({
      id: userId
    }).set({
      isPrivate
    });

    if (updatedUser) {
      return res.status(200).send({
        user: updatedUser
      });
    } else {
      return res.status(403).send({
        message: "The database does not contain a user id"
      });
    }
  },

  forgotPassword: async (req, res) => {
    const email = req.body.email || undefined;
    const localhost = req.body.localhost || undefined;

    if (!email) {
      return res.status(400).send({
        message: "email required."
      });
    }
    if (!localhost) {
      return res.status(400).send({
        message: "localhost URL required."
      });
    }

    const userFound = await User.findOne({
      email: email
    });
    if (!userFound) {
      return res.status(403).send({
        message: "email not in database"
      });
    } else {
      // const token = jwt.sign({ user: user.id }, process.env.JWT_SECRET, {
      //   expiresIn: 3600
      // });
      const token = crypto.randomBytes(20).toString("hex");

      await User.updateOne({
        email: email
      }).set({
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
        // html: `<p style="font-size: 16px;">Please click to reset password</p>
        // <br />
        // ${localhost}${
        //   _.endsWith(localhost, "/") ? "" : "/"
        // }accounts/password/reset/${token}<br /><br />
        // `

        html: `<div bgcolor="#F5F8FA" style="margin:0;padding:0"> 
        <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#F5F8FA" style="background-color:#f5f8fa;padding:0;margin:0;line-height:1px;font-size:1px"> 
         <tbody>
          <tr> 
           <td align="center" style="padding:0;margin:0;line-height:1px;font-size:1px"> 
            <table id="m_4007859049343016446header" align="center" width="448" style="width:448px;padding:0;margin:0;line-height:1px;font-size:1px" bgcolor="#ffffff" cellpadding="0" cellspacing="0" border="0"> 
             <tbody>
              <tr> 
               <td style="min-width:448px;padding:0;margin:0;line-height:1px;font-size:1px"> 
               <img src="https://res.cloudinary.com/dnzsa2z7b/image/upload/v1581590799/the-wind-blows/icon/favicon_si4agl.ico" style="min-width:448px;height:1px;margin:0;padding:0;display:block;border:none;outline:none" class="CToWUd"> </td> 
              </tr> 
             </tbody>
            </table> </td> 
          </tr> 
          <tr> 
           <td align="center" style="padding:0;margin:0;line-height:1px;font-size:1px"> 
             
            <table id="m_4007859049343016446header" align="center" width="448" style="width:448px;background-color:#ffffff;padding:0;margin:0;line-height:1px;font-size:1px" bgcolor="#ffffff" cellpadding="0" cellspacing="0" border="0"> 
             <tbody>
              <tr> 
               <td colspan="4" height="24" style="height:24px;padding:0;margin:0;line-height:1px;font-size:1px"> &nbsp; </td> 
              </tr> 
              <tr align="right"> 
               <td width="24" style="padding:0;margin:0;line-height:1px;font-size:1px"></td> 
               <td align="right" style="padding:0;margin:0;line-height:1px;font-size:1px"> 
                <a href="${localhost}" style="text-decoration:none;border-style:none;border:0;padding:0;margin:0"> 
                  <img width="32" align="right" src="https://res.cloudinary.com/dnzsa2z7b/image/upload/v1581590799/the-wind-blows/icon/favicon_si4agl.ico" style="width:32px;margin:0;padding:0;display:block;border:none;outline:none" class="CToWUd">
                </a> 
                </td> 
               <td width="24" style="padding:0;margin:0;line-height:1px;font-size:1px"></td> 
              </tr> 
              <tr> 
               <td colspan="3" height="24" style="height:24px;padding:0;margin:0;line-height:1px;font-size:1px"> 
               <img width="1" height="1" style="display:block;margin:0;padding:0;display:block;border:none;outline:none" src="https://ci3.googleusercontent.com/proxy/cavnPbpRVcv1fuITAotRtiwu2eC8S1MZnvqFCwVbwm4qCd7ix8H07xx6R649SMU2g19HsX2h8lJ1ijs21C0Bd4bonfXs5Kx8Csi5ZzfWf9RJRhhORvdsaUmWyzvwDgCu1hf2nPRmDOpA5JFYATlWuWCQZ36VdnWEj_i0EYwL3x8qy6QjLy9ZILFYxPnzvcwAAS4=s0-d-e1-ft#https://twitter.com/scribe/ibis?t=1&amp;cn=cGFzc3dvcmRfcmVzZXRfdjI%3D&amp;iid=0e8d0e9f6d514ac1a609a94890b708fa&amp;uid=388807492&amp;nid=248+20" class="CToWUd"> </td> 
              </tr> 
             </tbody>
            </table> 
             
             
            <table id="m_4007859049343016446header" align="center" width="448" style="width:448px;background-color:#ffffff;padding:0;margin:0;line-height:1px;font-size:1px" bgcolor="#ffffff" cellpadding="0" cellspacing="0" border="0"> 
             <tbody>
              <tr align="left;"> 
               <td width="24" style="padding:0;margin:0;line-height:1px;font-size:1px"></td> 
               <td align="left;" style="padding:0;margin:0;line-height:1px;font-size:1px"> 
                <table cellpadding="0" cellspacing="0" border="0" style="padding:0;margin:0;line-height:1px;font-size:1px"> 
                 <tbody>
                  <tr> 
                   <td align="left;" style="padding:0;margin:0;line-height:1px;font-size:1px;font-family:'HelveticaNeue','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:24px;line-height:32px;font-weight:bold;color:#292f33;text-align:left;text-decoration:none"> Reset your password? </td> 
                  </tr> 
                  <tr> 
                   <td height="12" style="padding:0;margin:0;line-height:1px;font-size:1px"></td> 
                  </tr> 
                  <tr> 
                   <td align="left;" style="padding:0;margin:0;line-height:1px;font-size:1px;font-family:'HelveticaNeue','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;line-height:20px;font-weight:400;color:#292f33;text-align:left;text-decoration:none"> If you requested a password reset for @${
                     userFound.username
                   }, click the button below. If you didn't make this request, ignore this email. </td> 
                  </tr> 
                  <tr> 
                   <td height="24" style="padding:0;margin:0;line-height:1px;font-size:1px"></td> 
                  </tr> 
                   
                  <tr> 
                   <td align="left;" style="padding:0;margin:0;line-height:1px;font-size:1px"> 
                    <table border="0" cellspacing="0" cellpadding="0" style="padding:0;margin:0;line-height:1px;font-size:1px"> 
                     <tbody>
                      <tr> 
                       <td style="padding:0;margin:0;line-height:1px;font-size:1px"> 
                         
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding:0;margin:0;line-height:1px;font-size:1px"> 
                         <tbody>
                          <tr> 
                           <td style="padding:0;margin:0;line-height:1px;font-size:1px"> 
                            <table border="0" cellspacing="0" cellpadding="0" style="padding:0;margin:0;line-height:1px;font-size:1px"> 
                             <tbody>
                              <tr> 
                               <td align="center" bgcolor="#1DA1F2" style="padding:0;margin:0;line-height:1px;font-size:1px;border-radius:4px;line-height:12px">
                               <a href="${localhost}${
          _.endsWith(localhost, "/") ? "" : "/"
        }accounts/password/reset/${token}" style="text-decoration:none;border-style:none;border:0;padding:0;margin:0;font-size:12px;font-family:'HelveticaNeue','Helvetica Neue',Helvetica,Arial,sans-serif;color:#ffffff;text-decoration:none;border-radius:4px;padding:8px 17px;border:1px solid #1da1f2;display:inline-block;font-weight:bold"> 
                                  <strong>Reset password</strong> 
                                  </a></td> 
                              </tr> 
                             </tbody>
                            </table> </td> 
                          </tr> 
                         </tbody>
                        </table> </td> 
                      </tr> 
                     </tbody>
                    </table> </td> 
                  </tr> 
                   
                   
                   
                   
                   
                  <tr> 
                   <td height="36" style="padding:0;margin:0;line-height:1px;font-size:1px"></td> 
                  </tr> 
                 </tbody>
                </table> </td> 
               <td width="24" style="padding:0;margin:0;line-height:1px;font-size:1px"></td> 
              </tr> 
               
              <tr> 
               <td height="1" style="line-height:1px;display:block;height:1px;background-color:#f5f8fa;padding:0;margin:0;line-height:1px;font-size:1px"></td> 
               <td align="center" style="padding:0;margin:0;line-height:1px;font-size:1px"> 
                <table width="100%" align="center" cellpadding="0" cellspacing="0" border="0" style="padding:0;margin:0;line-height:1px;font-size:1px;background-color:#ffffff;border-radius:5px"> 
                 <tbody>
                  <tr> 
                   <td height="1" style="line-height:1px;display:block;height:1px;background-color:#f5f8fa;padding:0;margin:0;line-height:1px;font-size:1px"></td> 
                  </tr> 
                 </tbody>
                </table> </td> 
               <td height="1" style="line-height:1px;display:block;height:1px;background-color:#f5f8fa;padding:0;margin:0;line-height:1px;font-size:1px"></td> 
              </tr> 
              <tr> 
               <td colspan="3" height="24" style="padding:0;margin:0;line-height:1px;font-size:1px"></td> 
              </tr> 
              <tr> 
               <td width="24" style="padding:0;margin:0;line-height:1px;font-size:1px"></td> 
               <td align="center" style="padding:0;margin:0;line-height:1px;font-size:1px"> 
                <table width="100%" align="center" cellpadding="0" cellspacing="0" border="0" bgcolor="#F5F8FA" style="padding:0;margin:0;line-height:1px;font-size:1px;background-color:#ffffff;border-radius:5px"> 
                 <tbody>
                  <tr> 
                   <td align="left" style="padding:0;margin:0;line-height:1px;font-size:1px"> 
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:0;margin:0;line-height:1px;font-size:1px"> 
                     <tbody>
                      <tr> 
                       <td style="padding:0;margin:0;line-height:1px;font-size:1px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;line-height:22px;text-align:left;color:#8899a6"> <strong>How do I know an email is from The Wind Blows?</strong> </td> 
                      </tr> 
                      <tr> 
                       <td colspan="3" height="12" style="padding:0;margin:0;line-height:1px;font-size:1px"></td> 
                      </tr> 
                      <tr> 
                       <td style="padding:0;margin:0;line-height:1px;font-size:1px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;line-height:19px;font-weight:400;text-align:left;color:#8899a6"> Links in this email will start with “https://” and contain “wind-blows.” Your browser will also display a padlock icon to let you know a site is secure. </td> 
                      </tr> 
                     </tbody>
                    </table> </td> 
                  </tr> 
                 </tbody>
                </table> </td> 
               <td width="24" style="padding:0;margin:0;line-height:1px;font-size:1px"></td> 
              </tr> 
              <tr> 
               <td colspan="3" height="24" style="padding:0;margin:0;line-height:1px;font-size:1px"></td> 
              </tr> 
              <tr> 
               <td height="1" style="line-height:1px;display:block;height:1px;background-color:#f5f8fa;padding:0;margin:0;line-height:1px;font-size:1px"></td> 
               <td align="center" style="padding:0;margin:0;line-height:1px;font-size:1px"> 
                <table width="100%" align="center" cellpadding="0" cellspacing="0" border="0" style="padding:0;margin:0;line-height:1px;font-size:1px;background-color:#ffffff;border-radius:5px"> 
                 <tbody>
                  <tr> 
                   <td height="1" style="line-height:1px;display:block;height:1px;background-color:#f5f8fa;padding:0;margin:0;line-height:1px;font-size:1px"></td> 
                  </tr> 
                 </tbody>
                </table> </td> 
               <td height="1" style="line-height:1px;display:block;height:1px;background-color:#f5f8fa;padding:0;margin:0;line-height:1px;font-size:1px"></td> 
              </tr> 
               
             </tbody>
            </table> 
             
             
            <table id="m_4007859049343016446footer" align="center" width="448" style="width:448px;background-color:#ffffff;padding:0;margin:0;line-height:1px;font-size:1px" cellpadding="0" cellspacing="0" border="0"> 
             <tbody>
              <tr> 
               <td height="36" style="height:36px;padding:0;margin:0;line-height:1px;font-size:1px"></td> 
              </tr> 
               
               
              <tr> 
               <td align="center" style="padding:0;margin:0;line-height:1px;font-size:1px"> <span style="font-family:'HelveticaNeue','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;line-height:16px;font-weight:400;color:#8899a6;text-align:left;text-decoration:none"> This email was meant for @${
                 userFound.username
               } </span> </td> 
              </tr> 
              <tr> 
               <td height="6" style="height:6px;line-height:1px;font-size:1px;padding:0;margin:0;line-height:1px;font-size:1px"></td> 
              </tr> 
              <tr> 
               <td align="center" style="padding:0;margin:0;line-height:1px;font-size:1px"> <span> <a href="#m_4007859049343016446_" style="text-decoration:none;border-style:none;border:0;padding:0;margin:0;font-family:'HelveticaNeue','Helvetica Neue',Helvetica,Arial,sans-serif;color:#8899a6;font-size:12px;padding:0px;margin:0px;font-weight:normal;line-height:12px">THE WIND BLOWS</a> </span> </td> 
              </tr> 
              <tr> 
               <td height="72" style="height:72px;padding:0;margin:0;line-height:1px;font-size:1px"></td> 
              </tr> 
             </tbody>
            </table> 
             </td> 
          </tr> 
         </tbody>
        </table><div class="yj6qo"></div><div class="adL">  
       </div></div>`
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
      return res.status(400).send({
        message: "reset password token request"
      });
    }

    const userFound = await User.findOne({
      resetPasswordToken: resetPasswordToken,
      resetPasswordExpires: {
        ">=": Date.now()
      }
    });

    if (!userFound) {
      return res.status(400).send({
        message: "password reset link is invalid or has expried"
      });
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

    const userUpdated = await User.updateOne({
      id: userId
    }).set({
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

    const userUpdated = await User.updateOne({
      id: userId
    }).set({
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
      return res.status(400).send({
        message: "userId required."
      });
    }

    const updatedUser = await User.updateOne({
      id: userId
    }).set({
      disabledAccount: true
    });

    if (updatedUser) {
      return res.status(200).send({
        message: "User has deactivation"
      });
    } else {
      return res.status(403).send({
        message: `The database does not contain this user id: ${userId}`
      });
    }
  },
  reactivatingUser: async (req, res) => {
    const userId = req.params.userId || undefined;

    if (_.isUndefined(req.param("userId"))) {
      return res.status(400).send({
        message: "userId required."
      });
    }

    const updatedUser = await User.updateOne({
      id: userId
    }).set({
      disabledAccount: false
    });

    if (updatedUser) {
      return res.status(200).send({
        message: "User has reactive"
      });
    } else {
      return res.status(403).send({
        message: `The database does not contain this user id: ${userId}`
      });
    }
  }
};
