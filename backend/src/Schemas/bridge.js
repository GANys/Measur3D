let mongoose = require("mongoose");

let Geometry = require("./utilities.js");

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

let BridgeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["Bridge", "BridgePart"], default: "Bridge" },
  geometry: {
    type: [mongoose.model("BridgeGeometry").schema],
    required: true
  },
  children: [],
  parents: {
    type: [String],
    required: function() {
      return this.type == "TunnelPart";
    }
  },
  address: {},
  attributes: {}
});

let BridgeInstallationSchema = new mongoose.Schema({
  name: { type: String, required: true },
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
  },
  attributes: {}
});

Bridge = mongoose.model("Bridge", BridgeSchema);
BridgeInstallation = mongoose.model(
  "BridgeInstallation",
  BridgeInstallationSchema
);

module.exports = {
  insertBridge: async (object, jsonName) => {
    var temp_children = []

    for (var child in object.children) {
      temp_children.push(jsonName + "_" + object.children[child])
    }

    object.children = temp_children

    var temp_parents = []

    for (var parent in object.parents) {
      temp_parents.push(jsonName + "_" + object.parents[parent])
    }

    object.parents = temp_parents

    var bridge = new Bridge(object);

    try {
      let element = await bridge.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  insertBridgeInstallation: async (object, jsonName) => {
    var temp_parents = []

    for (var parent in object.parents) {
      temp_parents.push(jsonName + "_" + object.parents[parent])
    }

    object.parents = temp_parents

    var bridge = new BridgeInstallation(object);

    try {
      let element = await bridge.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  Model: Bridge,
  Schema: BridgeSchema
};
