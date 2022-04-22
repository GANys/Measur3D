const mongoose = require("mongoose");

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function lengthInUtf8Bytes(str) {
  // Matches only the 10.. bytes that are non-initial characters in a multi-byte sequence.
  var m = encodeURIComponent(str).match(/%[89ABab]/g);
  return str.length + (m ? m.length : 0);
}

function smartDeleteObject(params) {
  var options = {};

  if (params.uid != undefined) {
    options = { uid: params.uid };
  } else {
    options = { _id: params._id };
  }
  //params are object.uid and smart
  return new Promise(function (resolve, reject) {
    mongoose
      .model("CityObject")
      .findOneAndDelete(options)
      .lean()
      .catch((err) => {
        resolve({
          error: "/deleteObject : there is no object with that uid.",
        });
      })
      .then(function (cityObject) {
        // Recursive deletion of all children of the deleted object
        if (params.smart) {
          if (
            cityObject.children != undefined &&
            cityObject.children.length > 0
          ) {
            for (var child in cityObject.children) {
              smartDeleteObject({
                uid: cityObject.children[child],
                smart: true,
              });
            }
          }

          // Update the children value for all parents of the deleted element
          if (
            cityObject.parents != undefined &&
            cityObject.parents.length > 0
          ) {
            for (var parent in cityObject.parents) {
              mongoose.model("CityObject").updateOne(
                { uid: cityObject.parents[parent] },
                {
                  $pull: {
                    children: [{ _id: cityObject.uid }],
                  },
                },
                (err, objectParent) => {
                  if (err)
                    resolve({
                      error:
                        "/deleteObject: this object is isolated (no parent found).",
                    });
                }
              );
            }
          }

          // Delete reference within CityModel document
          mongoose
            .model("CityModel")
            .findOneAndUpdate(
              { CityObjects: cityObject._id },
              {
                $pull: {
                  CityObjects: cityObject._id,
                },
              },
              (err, data_citymodel) => {
                if (err)
                  resolve({
                    error:
                      "/deleteObject: this object is isolated (no city model found).",
                  });
              }
            )
            .lean();
        }

        mongoose
          .model("Geometry")
          .deleteMany({ _id: { $in: cityObject.geometry } }, (err) => {
            if (err)
              resolve({
                error: "/deleteObject: there is no geometry with that name.",
              });
          });
      });

    resolve({
      success: "/deleteObject: object and all its dependencies deleted.",
    });
  });
}

function mapType(type) {
  switch (type) {
    case "BuildingPart":
    case "BuildingRoom":
    case "BuildingStorey":
    case "BuildingUnit":
      type = "Building";
      break;
    case "BuildingConstructiveElement":
    case "BuildingFurniture":
      type = "BuildingInstallation";
      break;
    case "Road":
    case "Railway":
    case "Waterway":
    case "TransportSquare":
      type = "Transportation";
      break;
    case "TunnelPart":
      type = "Tunnel";
      break;
    case "TunnelConstructiveElement":
    case "TunnelHollowSpace":
    case "TunnelFurniture":
      type = "TunnelInstallation";
      break;
    case "BridgePart":
      type = "Bridge";
      break;
    case "BridgeConstructiveElement":
      type = "BridgeInstallation";
      break;
    default:
  }

  return type;
}

module.exports = { formatBytes, lengthInUtf8Bytes, smartDeleteObject, mapType };
