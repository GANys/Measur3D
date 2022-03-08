let mongoose = require("mongoose");

let PlantCover = new mongoose.Schema({
  attributes: {
    averageHeight: Number,
  },
});

module.exports = {
  PlantCover: PlantCover,
};
