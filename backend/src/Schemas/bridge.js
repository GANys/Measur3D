let mongoose = require("mongoose");

let Bridge = new mongoose.Schema({
  parents: {
    type: [String],
    default: undefined,
    required: function () {
      return this.type == "BridgePart";
    },
  },
  address: {},
  attributes: {
    yearOfConstruction: Number,
    yearOfDemolition: Number,
    isMovable: Boolean,
  },
});

let BridgeInstallation = new mongoose.Schema({
  parents: {
    type: [String],
    required: true,
  },
});

module.exports = {
  Bridge: Bridge,
  BridgeInstallation: BridgeInstallation,
};
