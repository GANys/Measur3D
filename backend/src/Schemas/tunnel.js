let mongoose = require("mongoose");

let Geometry = require("./utilities.js");

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

let TunnelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["Tunnel", "TunnelPart"], default: "Tunnel" },
  geometry: {
    type: [mongoose.model("TunnelGeometry").schema],
    required: true
  },
  children: [],
  parents: {
    type: [String],
    required: function() {
      return this.type == "TunnelPart";
    }
  },
  attributes: {}
});

let TunnelInstallationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, default: "TunnelInstallation" },
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

Tunnel = mongoose.model("Tunnel", TunnelSchema);
TunnelInstallation = mongoose.model("TunnelInstallation", TunnelInstallationSchema);

module.exports = {
  insertTunnel: async (object, jsonName) => {
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

    var tunnel = new Tunnel(object);

    try {
      let element = await tunnel.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  insertTunnelInstallation: async (object, jsonName) => {
    var temp_parents = []

    for (var parent in object.parents) {
      temp_parents.push(jsonName + "_" + object.parents[parent])
    }

    object.parents = temp_parents

    var tunnel = new TunnelInstallation(object);

    try {
      let element = await tunnel.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  Model: Tunnel,
  Schema: TunnelSchema
};
