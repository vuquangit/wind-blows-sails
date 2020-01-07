module.exports = {
  findUser: userId => {
    const data = User.find({
      where: { id: "5e0dc20d3f540b447ca3b237" },
      select: ["bio", "fullName"]
    });

    if (data.length) return "User can't found";
    console.log(data);
    return data;
  }
};
