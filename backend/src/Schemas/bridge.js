let mongoose = require("mongoose");

let Geometry = require("./geometry.js");
let CityObject = require("./abstractcityobject.js");

let Bridge = mongoose.model("CityObject").discriminator(
  "Bridge",
  new mongoose.Schema({
    type: { type: String, enum: ["Bridge", "BridgePart"], default: "Bridge" },
    geometry: [mongoose.Schema.Types.Mixed],
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

let BridgeInstallation = mongoose.model("CityObject").discriminator(
  "BridgeInstallation",
  new mongoose.Schema({
    type: {
      type: String,
      enum: ["BridgeInstallation", "BridgeConstructionElement"],
      default: "BridgeInstallation"
    },
    geometry: [mongoose.Schema.Types.Mixed],
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

    object["CityModel"] = jsonName;

    var temp_geometries = [];

    for (var geometry in object.geometry) {
      var authorised_type = ["Solid", "CompositeSolid", "MultiSurface", "MultiPoint"];
      if (!authorised_type.includes(object.geometry[geometry].type)) {
        throw new Error(object.type + " is not a valid geometry type.");
        return;
      }

      temp_geometries.push(
        await Geometry.insertGeometry(object.geometry[geometry], jsonName)
      );
    }

    object.geometry = temp_geometries;

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

    object["CityModel"] = jsonName;

    var temp_geometries = [];

    for (var geometry in object.geometry) {
      var authorised_type = ["Solid", "MultiSolid", "CompositeSolid", "MultiSurface", "CompositeSurface", "MultiLineString", "MultiPoint"]; /////////////////////////////////////////////////////////////////////
      if (!authorised_type.includes(object.geometry[geometry].type)) {
        throw new Error(object.type + " is not a valid geometry type.");
        return;
      }

      temp_geometries.push(
        await Geometry.insertGeometry(object.geometry[geometry], jsonName)
      );
    }

    object.geometry = temp_geometries;

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
