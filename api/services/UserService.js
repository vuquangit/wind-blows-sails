module.exports = {
  counts: async userId => {
    const userFound = await User.findOne({
      where: { id: userId }
    })
      .populate("follower")
      .populate("following")
      .populate("postId");

    const _counts = {
      followedBy: userFound.follower.length,
      follows: userFound.following.length,
      media: userFound.postId.length
    };

    return _counts;
  }
};
