let mongoose = require("mongoose");

let Geometry = require("./geometry.js");
let CityObject = require("./abstractcityobject.js");

let Tunnel = mongoose.model("CityObject").discriminator(
  "Tunnel",
  new mongoose.Schema({
    type: { type: String, enum: ["Tunnel", "TunnelPart"], default: "Tunnel" },
    geometry: [mongoose.Schema.Types.Mixed],
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

let TunnelInstallation = mongoose.model("CityObject").discriminator(
  "TunnelInstallation",
  new mongoose.Schema({
    type: { type: String, enum: ["TunnelInstallation", "TunnelConstructiveElement", "TunnelHollowSpace", "TunnelFurniture"],default: "TunnelInstallation" },
    geometry: [mongoose.Schema.Types.Mixed],
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

    object["CityModel"] = jsonName

    var temp_geometries = [];

    for (var geometry in object.geometry) {
      var authorised_type = ["Solid", "CompositeSolid", "MultiSurface", "MultiPoint"];
      if (!authorised_type.includes(object.geometry[geometry].type)) {
        throw new Error(object.geometry[geometry].type + " is not a valid geometry type.");
        return;
      }

      temp_geometries.push(await Geometry.insertGeometry(object.geometry[geometry], jsonName));
    }

    object.geometry = temp_geometries;

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

    object["CityModel"] = jsonName

    var temp_geometries = [];

    for (var geometry in object.geometry) {
      var authorised_type = ["Solid", "MultiSolid", "CompositeSolid", "MultiSurface", "CompositeSurface", "MultiLineString", "MultiPoint"];
      if (!authorised_type.includes(object.geometry[geometry].type)) {
        throw new Error(object.geometry[geometry].type + " is not a valid geometry type.");
        return;
      }

      temp_geometries.push(await Geometry.insertGeometry(object.geometry[geometry], jsonName));
    }

    object.geometry = temp_geometries;

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
