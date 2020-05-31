let mongoose = require("mongoose");

let Geometry = require("./geometry.js");
let AbstractCityObject = require("./abstractcityobject");

let TunnelGeometry = mongoose.model("Geometry").discriminator(
  "TunnelGeometry",
  new mongoose.Schema({
    type: {
      type: String,
      required: true,
      enum: ["Solid", "CompositeSolid", "MultiSurface"]
    }
  })
);

let Tunnel = mongoose.model("AbstractCityObject").discriminator(
  "Tunnel",
  new mongoose.Schema({
    type: { type: String, enum: ["Tunnel", "TunnelPart"], default: "Tunnel" },
    geometry: {
      type: [mongoose.model("TunnelGeometry").schema],
      required: true
    },
    parents: {
      type: [String],
      default: undefined,
      required: function() {
        return this.type == "TunnelPart";
      }
    },
    attributes: {
      yearOfConstruction: Number,
      yearOfDemolition: Number
    }
  })
);

let TunnelInstallation = mongoose.model("AbstractCityObject").discriminator(
  "TunnelInstallation",
  new mongoose.Schema({
    type: { type: String, default: "TunnelInstallation" },
    geometry: {
      type: [mongoose.model("Geometry").schema],
      required: true
    },
    parents: {
      type: [String],
      required: true
    }
  })
);

module.exports = {
  insertTunnel: async (object, jsonName) => {
    var temp_children = [];

    for (var child in object.children) {
      temp_children.push(jsonName + "_" + object.children[child]);
    }

    object.children = temp_children;

    var temp_parents = [];

    for (var parent in object.parents) {
      temp_parents.push(jsonName + "_" + object.parents[parent]);
    }

    object.parents = temp_parents;

    var tunnel = new Tunnel(object);

    try {
      let element = await tunnel.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  insertTunnelInstallation: async (object, jsonName) => {
    var temp_parents = [];

    for (var parent in object.parents) {
      temp_parents.push(jsonName + "_" + object.parents[parent]);
    }

    object.parents = temp_parents;

    var tunnel = new TunnelInstallation(object);

    try {
      let element = await tunnel.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  Model: Tunnel
};
