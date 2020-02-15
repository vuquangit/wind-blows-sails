const dotenv = require("dotenv");
dotenv.config();

const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const clientId = process.env.SERVER_MAIL_CLIENT_ID;
const clientSecret = process.env.SERVER_MAIL_CLIENT_SECRET;
const refreshToken = process.env.SERVER_MAIL_REFRESH_TOKEN;
const authorizationCode = process.env.SERVER_MAIL_AUTHORIZATION_CODE;

module.exports = {
  send: async (req, res) => {
    console.log(clientId, clientSecret);

    const oauth2Client = new google.auth.OAuth2(
      "631590918663-qihlsv8ouoi1b0dtddnonm8nh6nlf5je.apps.googleusercontent.com",
      "MmFswnUXpzugd2EONZGM_xyP",
      "https://developers.google.com/oauthplayground"
    );

    // const scopes = ["https://mail.google.com/"];
    // const url = oauth2Client.generateAuthUrl({
    //   // 'online' (default) or 'offline' (gets refresh_token)
    //   access_type: "offline",
    //   // If you only need one scope you can pass it as a string
    //   scope: scopes
    // });
    // console.log(url);

    // This will provide an object with the access_token and refresh_token.
    // Save these somewhere safe so they can be used at a later time.
    // console.log(authorizationCode, " authCode");

    // oauth2Client.setCredentials({
    //   refresh_token:
    //     "1//04DyQtqF37w7oCgYIARAAGAQSNwF-L9Ira4b1lcaqiujHitqa8RpMaGLmP02HWjr85CDZczoMfY0PoZ8BDSePfuQ7Cb5gVKzf1Xs"
    // });
    // const accessToken = await oauth2Client.getAccessToken();
    // console.log("accestoken: ", accessToken);

    // oauth2Client.on("tokens", tokens => {
    //   if (tokens.refresh_token) {
    //     // store the refresh_token in my database!
    //     console.log(tokens.refresh_token);
    //   }
    //   console.log(tokens.access_token);
    // });
    // console.log("refresh token", refreshToken);

    // await oauth2Client.setCredentials({
    //   // eslint-disable-next-line camelcase
    //   refresh_token: refreshToken
    // });
    // // const accessToken = await oauth2Client.getAccessToken();
    // // console.log("acces token: ", accessToken);

    // oauth2Client.on("tokens", tokens => {
    //   if (tokens.refresh_token) {
    //     // store the refresh_token in my database!
    //     console.log(tokens.refresh_token);
    //   }
    //   console.log(tokens.access_token);
    // });

    // const smtpTransport = nodemailer.createTransport({
    //   service: "gmail",
    //   auth: {
    //     type: "OAuth2",
    //     user: "thewindblows.server@gmail.com",
    //     clientId: clientId,
    //     clientSecret: clientSecret,
    //     refreshToken: refreshToken,
    //     accessToken: accessToken
    //   }
    // });

    // const mailOptions = {
    //   from: "The Wind Blows <thewindblows.server@gmail.com>",
    //   to: "vuquangit@gmail.com",
    //   subject: "Reset password",
    //   html: `<p style="font-size: 16px;">Password reset: </p>
    //     <br />`
    // };

    // // returning result
    // smtpTransport.sendMail(mailOptions, (erro, info) => {
    //   if (erro) {
    //     return res.send(erro.toString());
    //   }
    //   return res.send("Sended");
    // });

    return res.send("Sended");
  }
};
