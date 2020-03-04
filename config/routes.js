module.exports.routes = {
  "/": { view: "pages/homepage" },

  // Auth controllers
  "PUT /api/v1/auth/me/": "AuthController.currentUser",
  "POST /api/v1/auth/signup": "AuthController.signup",
  "POST /api/v1/auth/login": "AuthController.login",
  "POST /api/v1/auth/token": "AuthController.refreshToken",

  // User controllers
  "POST /api/v1/username/": "UserController.userNameInfo",
  "GET /api/v1/user/:id": "UserController.userIdInfo",

  "POST /api/v1/users/update": "UserController.updateInfoUser",
  "POST /api/v1/users/change-password": "UserController.changePassword",
  "POST /api/v1/users/change-profile-photo":
    "UserController.changeProfilePicture",
  "POST /api/v1/users/forgot-password": "UserController.forgotPassword",
  "GET /api/v1/users/reset-password": "UserController.resetPassword",
  "POST /api/v1/users/change-private-account":
    "UserController.changePrivateAccount",

  "POST /api/v1/users/notifications/add":
    "UserController.saveNotificationToken",
  "POST /api/v1/users/notifications/delete":
    "UserController.deleteNotificationToken",

  "POST /api/v1/users/deactivation": "UserController.deactivationUser",
  "POST /api/v1/users/reactivating": "UserController.reactivatingUser",

  // Follow controllers
  "POST /api/v1/follows/add": "FollowController.addFollow",
  "POST /api/v1/follows/unfollow": "FollowController.unfollow",
  "GET /api/v1/follows/following": "FollowController.following",
  "GET /api/v1/follows/following/username":
    "FollowController.usernameFollowing",
  "GET /api/v1/follows/follower": "FollowController.follower",
  "GET /api/v1/follows/followers/username":
    "FollowController.usernameFollowers",

  "POST /api/v1/follow-requests/add": "FollowController.addFollowRequest",
  "POST /api/v1/follow-requests/unfollow": "FollowController.unfollowRequest",
  "GET /api/v1/follow-requests/follow-requests":
    "FollowController.followRequests",
  "GET /api/v1/follow-requests/follower-requests":
    "FollowController.followerRequests",
  "POST /api/v1/follow-requests/approve": "FollowController.approveFollow",
  "POST /api/v1/follow-requests/deny": "FollowController.denyFollow",

  // Blocked controllers
  "POST /api/v1/add-user-blocked": "BlockedController.addUserBlocked",
  "POST /api/v1/unblock": "BlockedController.unblock",
  "POST /api/v1/blocked": "BlockedController.blocked",

  // Post controllers
  "GET /api/v1/posts": "PostController.posts",
  "GET /api/v1/posts-following": "PostController.postsFollowing",
  "POST /api/v1/post": "PostController.post",
  "POST /api/v1/post/add": "PostController.addPost",
  "POST /api/v1/post/modify": "PostController.modifyPost",
  "POST /api/v1/post/delete": "PostController.deletePost",

  "GET /api/v1/post/likes": "PostController.likes",
  "POST /api/v1/post/likes/like": "PostController.likePost",
  "POST /api/v1/post/likes/unlike": "PostController.unlikePost",

  "GET /api/v1/post/comments": "PostController.comments",
  "GET /api/v1/post/comments/child": "PostController.childComments",
  "POST /api/v1/post/comments/add": "PostController.addComment",
  "POST /api/v1/post/comments/delete": "PostController.deleteComment",
  "POST /api/v1/post/comments/undo": "PostController.undoDeleteComment",

  "GET /api/v1/post/comments/likes": "PostController.likesComments",
  "POST /api/v1/post/comments/likes/like": "PostController.likeComments",
  "POST /api/v1/post/comments/likes/unlike": "PostController.unlikeComments",

  // Save post controllers
  "GET /api/v1/saved/posts": "SavePostController.posts",
  "POST /api/v1/saved/add": "SavePostController.savePost",
  "POST /api/v1/saved/delete": "SavePostController.deleteSavePost",

  // Image upload
  "POST /api/v1/images/upload": "UploadImageController.uploadImage",
  "POST /api/v1/images/uploads": "UploadImageController.uploadImages",
  "POST /api/v1/images/delete": "UploadImageController.deleteImage",
  "POST /api/v1/images/deletes": "UploadImageController.deleteImages",

  // Notifications
  "GET /api/v1/users/notifications": "NotificationsController.notifications",
  "POST /api/v1/users/notifications/total-unread":
    "NotificationsController.totalUnread",
  "POST /api/v1/users/notifications/read":
    "NotificationsController.readNotification",
  "POST /api/v1/users/notifications/unread":
    "NotificationsController.unreadNotification",
  "POST /api/v1/users/notifications/read-all":
    "NotificationsController.readAllNotification",
  "POST /api/v1/users/notifications/delete":
    "NotificationsController.deleteNotification",

  // explore
  "GET /api/v1/explore/people/suggested": "ExploreController.suggestions",
  "GET /api/v1/explore/people/search": "ExploreController.search"
};
