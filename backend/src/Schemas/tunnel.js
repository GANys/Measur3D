let mongoose = require("mongoose");

let Geometry = require("./geometry.js");
let CityObject = require("./abstractcityobject.js");

let Tunnel = mongoose.model("CityObject").discriminator(
  "Tunnel",
  new mongoose.Schema({
    type: { type: String, enum: ["Tunnel", "TunnelPart"], default: "Tunnel" },
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
  })
);

let TunnelInstallation = mongoose.model("CityObject").discriminator(
  "TunnelInstallation",
  new mongoose.Schema({
    type: {
      type: String,
      default: "TunnelInstallation",
      enum: [
        "TunnelInstallation",
        "TunnelConstructiveElement",
        "TunnelHollowSpace",
        "TunnelFurniture",
      ],
    },
    parents: {
      type: [String],
      required: true,
    },
  })
);

module.exports = {
  insertTunnel: (object) => {
    return new Promise(async function (resolve, reject) {
      var temp_geometries = [];

      for (var geometry in object.geometry) {
        var authorised_type = [
          "Solid",
          "CompositeSolid",
          "MultiSurface",
          "MultiPoint",
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
        var tunnel = new Tunnel(object);

        try {
          tunnel.save().then((data) => {
            resolve(mongoose.Types.ObjectId(data.id));
          });
        } catch (err) {
          console.error(err.message);
        }
      });
    });
  },
  insertTunnelInstallation: (object) => {
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
        var tunnel = new TunnelInstallation(object);

        try {
          tunnel.save().then((data) => {
            resolve(mongoose.Types.ObjectId(data.id));
          });
        } catch (err) {
          console.error(err.message);
        }
      });
    });
  },
  Model: Tunnel,
};
