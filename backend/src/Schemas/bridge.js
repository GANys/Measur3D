let mongoose = require("mongoose");

let Geometry = require("./geometry.js");
let CityObject = require("./abstractcityobject.js");

let Bridge = mongoose.model("CityObject").discriminator(
  "Bridge",
  new mongoose.Schema({
    type: { type: String, enum: ["Bridge", "BridgePart"], default: "Bridge" },
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
  })
);

let BridgeInstallation = mongoose.model("CityObject").discriminator(
  "BridgeInstallation",
  new mongoose.Schema({
    type: {
      type: String,
      enum: ["BridgeInstallation", "BridgeConstructiveElement"],
      default: "BridgeInstallation",
    },
    parents: {
      type: [String],
      required: true,
    },
  })
);

module.exports = {
  insertBridge: (object) => {
    return new Promise(async function (resolve, reject) {
      var temp_geometries = [];

      for (var geometry in object.geometry) {
        var authorised_type = [
          "Solid",
          "MultiSolid",
          "MultiSurface",
          "CompositeSurface",
          "CompositeSolid",
        ];
        if (!authorised_type.includes(object.geometry[geometry].type)) {
          throw new Error(object.type + " is not a valid geometry type.");
          return;
        }

        temp_geometries.push(
          Geometry.insertGeometry(object.geometry[geometry])
        );
      }

      Promise.all(temp_geometries).then((resolved_geometries) => {
        object.geometry = resolved_geometries;
        var bridge = new Bridge(object);

        try {
          bridge.save().then((data) => {
            resolve(mongoose.Types.ObjectId(data.id));
          });
        } catch (err) {
          console.error(err.message);
        }
      });
    });
  },
  insertBridgeInstallation: (object) => {
    return new Promise(async function (resolve, reject) {
      var temp_geometries = [];

      for (var geometry in object.geometry) {
        var authorised_type = [
          "Solid",
          "MultiSolid",
          "CompositeSolid",
          "MultiSurface",
          "CompositeSurface",
          "MultiLineString",
          "MultiPoint",
        ]; /////////////////////////////////////////////////////////////////////
        if (!authorised_type.includes(object.geometry[geometry].type)) {
          throw new Error(object.type + " is not a valid geometry type.");
          return;
        }

        temp_geometries.push(
          Geometry.insertGeometry(object.geometry[geometry])
        );
      }

      Promise.all(temp_geometries).then((resolved_geometries) => {
        object.geometry = resolved_geometries;
        var bridge = new BridgeInstallation(object);

        try {
          bridge.save().then((data) => {
            resolve(mongoose.Types.ObjectId(data.id));
          });
        } catch (err) {
          console.error(err.message);
        }
      });
    });
  },
  Model: Bridge,
};
