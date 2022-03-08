let mongoose = require("mongoose");

let CityObjectGroup = new mongoose.Schema({
  children: {
    type: [String],
    required: true,
  },
});

module.exports = {
  CityObjectGroup: CityObjectGroup,
};
