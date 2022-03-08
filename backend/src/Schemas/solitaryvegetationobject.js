let mongoose = require("mongoose");

// let SolitaryVegetationObjectGeometry

let SolitaryVegetationObject = new mongoose.Schema({
  attributes: {
    species: String,
    trunkDiameter: Number,
    crownDiameter: Number,
  },
});

module.exports = {
  SolitaryVegetationObject: SolitaryVegetationObject,
};
