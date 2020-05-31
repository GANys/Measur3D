let mongoose = require("mongoose");

let Geometry = require("./geometry.js");
let AbstractCityObject = require("./abstractcityobject");

let BridgeGeometry = mongoose.model("Geometry").discriminator(
  "BridgeGeometry",
  new mongoose.Schema({
    type: {
      type: String,
      required: true,
      enum: ["Solid", "CompositeSolid", "MultiSurface"]
    }
  })
);

let Bridge = mongoose.model("AbstractCityObject").discriminator(
  "Bridge",
  new mongoose.Schema({
    type: { type: String, enum: ["Bridge", "BridgePart"], default: "Bridge" },
    geometry: {
      type: [mongoose.model("BridgeGeometry").schema],
      required: true
    },
    parents: {
      type: [String],
      default: undefined,
      required: function() {
        return this.type == "BridgePart";
      }
    },
    address: {},
    attributes: {
      yearOfConstruction: Number,
      yearOfDemolition: Number,
      isMovable: Boolean
    }
  })
);

let BridgeInstallation = mongoose.model("AbstractCityObject").discriminator(
  "BridgeInstallation",
  new mongoose.Schema({
    type: {
      type: String,
      enum: ["BridgeInstallation", "BridgeConstructionElement"],
      default: "BridgeInstallation"
    },
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
  insertBridge: async (object, jsonName) => {
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

    var bridge = new Bridge(object);

    try {
      let element = await bridge.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  insertBridgeInstallation: async (object, jsonName) => {
    var temp_parents = [];

    for (var parent in object.parents) {
      temp_parents.push(jsonName + "_" + object.parents[parent]);
    }

    object.parents = temp_parents;

    var bridge = new BridgeInstallation(object);

    try {
      let element = await bridge.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  Model: Bridge
};
