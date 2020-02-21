/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your actions.
 *
 * For more information on configuring policies, check out:
 * https://sailsjs.com/docs/concepts/policies
 */

module.exports.policies = {
  /***************************************************************************
   *                                                                          *
   * Default policy for all controllers and actions, unless overridden.       *
   * (`true` allows public access)                                            *
   *                                                                          *
   ***************************************************************************/
  // '*': true,

  BlockedController: {
    "*": "isAuthenticated"
  },
  FollowController: {
    "*": "isAuthenticated"
  },
  NotificationsController: {
    "*": "isAuthenticated"
  },
  PostController: {
    "*": "isAuthenticated",
    post: true,
    comments: true
  },
  SavePostController: {
    "*": "isAuthenticated"
  },
  UploadImageController: {
    "*": "isAuthenticated"
  },
  UserController: {
    "*": "isAuthenticated",
    saveNotificationToken: true,
    deleteNotificationToken: true,
    forgotPassword: true,
    resetPassword: true,
    userIdInfo: true
  },
  ExploreController: {
    "*": "isAuthenticated"
  }
};
