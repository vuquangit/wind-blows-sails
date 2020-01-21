/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {
  /***************************************************************************
   *                                                                          *
   * Make the view located at `views/homepage.ejs` your home page.            *
   *                                                                          *
   * (Alternatively, remove this and add an `index.html` file in your         *
   * `assets` directory)                                                      *
   *                                                                          *
   ***************************************************************************/

  "/": { view: "pages/homepage" },

  /***************************************************************************
   *                                                                          *
   * More custom routes here...                                               *
   * (See https://sailsjs.com/config/routes for examples.)                    *
   *                                                                          *
   * If a request to a URL doesn't match any of the routes in this file, it   *
   * is matched against "shadow routes" (e.g. blueprint routes).  If it does  *
   * not match any of those, it is matched against static assets.             *
   *                                                                          *
   ***************************************************************************/
  // Auth controllers
  "PUT /api/v1/auth/me/": "AuthController.currentUser",
  "POST /api/v1/auth/signup": "AuthController.signup",
  "POST /api/v1/auth/login": "AuthController.login",

  // User controllers
  "POST /api/v1/username/": "UserController.userNameInfo",
  "GET /api/v1/user/:id": "UserController.userIdInfo",
  "GET /api/v1/posts": "UserController.posts",

  // Follow controllers
  "POST /api/v1/follows/add": "FollowController.addFollow",
  "POST /api/v1/follows/unfollow": "FollowController.unfollow",
  "GET /api/v1/follows/following": "FollowController.following",
  "GET /api/v1/follows/following/username":
    "FollowController.usernameFollowing",
  "GET /api/v1/follows/follower": "FollowController.follower",
  "GET /api/v1/follows/followers/username":
    "FollowController.usernameFollowers",

  // Blocked controllers
  "POST /api/v1/add-user-blocked": "BlockedController.addUserBlocked",
  "POST /api/v1/unblock": "BlockedController.unblock",
  "POST /api/v1/blocked": "BlockedController.blocked",

  // Post controllers
  "POST /api/v1/add-post": "PostController.addPost",
  "POST /api/v1/post": "PostController.post",
  "POST /api/v1/like-post": "PostController.likePost",
  "POST /api/v1/add-comments": "PostController.addComments",
  "POST /api/v1/comments": "PostController.comments",
  "POST /api/v1/like-comments": "PostController.likeComments",

  // Save post controllers
  "POST /api/v1/saved-post": "SavePostController.saved",

  // Image upload
  "POST /api/v1/image-upload": "ImageUploadController.imageUpload"
};
