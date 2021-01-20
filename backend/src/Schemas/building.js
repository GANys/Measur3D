let mongoose = require("mongoose");

let Geometry = require("./geometry.js");
let CityObject = require("./abstractcityobject.js");

let Building = mongoose.model("CityObject").discriminator(
  "Building",
  new mongoose.Schema({
    type: {
      type: String,
      enum: ["Building", "BuildingPart"],
      default: "Building"
    },
    attributes: {
      measuredHeight: Number,
      roofType: String,
      storeysAboveGround: Number,
      storeysBelowGround: Number,
      storeyHeightsAboveGround: { type: [Number], default: undefined },
      storeyHeightsBelowGround: { type: [Number], default: undefined },
      yearOfConstruction: Number,
      yearOfDemolition: Number
    },
    address: {
      CountryName: String,
      LocalityName: String,
      ThoroughfareNumber: Number,
      ThoroughfareName: String,
      PostalCode: String,
      location: {
        type: [mongoose.model("Geometry").schema],
        default: undefined
      }
    },
    parents: {
      type: [String],
      default: undefined,
      required: function() {
        return this.type == "BuildingPart";
      }
    },
    geometry: [mongoose.Schema.Types.Mixed]
  })
);

let BuildingInstallation = mongoose.model("CityObject").discriminator(
  "BuildingInstallation",
  new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, default: "BuildingInstallation" },
    geographicalExtent: { type: [Number], default: undefined },
    geometry: [mongoose.Schema.Types.Mixed],
    parents: { type: [String], default: undefined, required: true },
    attributes: {}
  })
);

module.exports = {
  insertBuilding: async (object, jsonName) => {
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
        throw new Error(object.type + " is not a valid geometry type.");
        return;
      }

      temp_geometries.push(await Geometry.insertGeometry(object.geometry[geometry], jsonName));
    }

    object.geometry = temp_geometries;

    var building = new Building(object);

    try {
      let element = await building.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },

  insertBuildingInstallation: async (object, jsonName) => {
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
      var authorised_type = ["Solid", "MultiSolid", "CompositeSolid", "MultiSurface", "CompositeSurface", "MultiLineString", "MultiPoint"];
      if (!authorised_type.includes(object.geometry[geometry].type)) {
        throw new Error(object.type + " is not a valid geometry type.");
        return;
      }

      temp_geometries.push(await Geometry.insertGeometry(object.geometry[geometry], jsonName));
    }

    object.geometry = temp_geometries;

    var building = new BuildingInstallation(object);

    try {
      let element = await building.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },
  Model: Building
};
