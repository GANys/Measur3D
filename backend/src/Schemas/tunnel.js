let mongoose = require("mongoose");

let Tunnel = new mongoose.Schema({
  parents: {
    type: [String],
    default: undefined,
    required: function () {
      return this.type == "TunnelPart";
    },
  },
  attributes: {
    yearOfConstruction: Number,
    yearOfDemolition: Number,
  },
});

let TunnelInstallation = new mongoose.Schema({
  parents: {
    type: [String],
    required: true,
  },
});

module.exports = {
  Tunnel: Tunnel,
  TunnelInstallation: TunnelInstallation,
};
