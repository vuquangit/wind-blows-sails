module.exports = {
  fn: async function() {
    // Display a personalized welcome view.
    try {
      const newTest = await Test.create();
      return { abc: newTest };
    } catch (error) {
      return "Fail to create";
    }
  }
};
