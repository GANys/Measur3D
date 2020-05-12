let mongoose = require("mongoose");

let Bridge = require("./bridge.js");
let Building = require("./building.js");
let CityFurniture = require("./cityfurniture.js");
let CityObjectGroup = require("./cityobjectgroup.js");
let GenericCityObject = require("./genericcityobject.js");
let LandUse = require("./landuse.js");
let PlantCover = require("./plantcover.js");
let SolitaryVegetationObject = require("./solitaryvegetationobject.js");
let TINRelief = require("./tinrelief.js");
let Transportation = require("./transportation.js");
let Tunnel = require("./tunnel.js");
let WaterBody = require("./waterbody.js");

let CityModelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, default: "CityJSON", required: true },
  version: { type: String, default: "1.0", required: true },
  CityObjects: { type: {}, required: true },
  vertices: {
    type: Array,
    required: true,
    index: true
  },
  extension: { type: {}, required: false },
  metadata: {
    geographicalExtent: [Number],
    referenceSystem: {
      type: String,
      default: "urn:ogc:def:crs:EPSG::4326",
      required: true
    }
  },
  transform: {
    scale: [],
    translate: []
  },
  appearance: { type: {}, required: false },
  "geometry-templates": { type: {}, required: false }
});

CityModel = mongoose.model("CityModel", CityModelSchema);

module.exports = {
  insertCity: async object => {
    var new_objects = {};

    object.json["name"] = object.jsonName;

    for ([key, element] of Object.entries(object.json.CityObjects)) {
      try {
        switch (element.type) {
          case "Building":
          case "BuildingPart":
            element["name"] = object.jsonName + "_" + key; // Add a reference to the building for the client - attribute in document
            var element_id = await Building.insertBuilding(element);
            break;
          case "BuildingInstallation":
            element["name"] = object.jsonName + "_" + key; // Add a reference to the building for the client - attribute in document
            var element_id = await Building.insertBuildingInstallation(element);
            break;
          case "Bridge":
          case "BridgePart":
            element["name"] = object.jsonName + "_" + key;
            var element_id = await Bridge.insertBridge(element);
            break;
          case "BridgeInstallation":
          case "BridgeConstructionElement":
            element["name"] = object.jsonName + "_" + key;
            var element_id = await Bridge.insertBridgeInstallation(element);
            break;
          case "CityObjectGroup":
            element["name"] = object.jsonName + "_" + key;
            var element_id = await CityObjectGroup.insertCityObjectGroup(
              element
            );
            break;
          case "CityFurniture":
            element["name"] = object.jsonName + "_" + key;
            var element_id = await CityFurniture.insertCityFurniture(element);
            break;
          case "GenericCityObject":
            element["name"] = object.jsonName + "_" + key;
            var element_id = await GenericCityObject.insertGenericCityObject(
              element
            );
            break;
          case "LandUse":
            element["name"] = object.jsonName + "_" + key;
            var element_id = await LandUse.insertLandUse(element);
            break;
          case "PlantCover":
            element["name"] = object.jsonName + "_" + key;
            var element_id = await PlantCover.insertPlantCover(element);
            break;
          case "Railway":
            element["name"] = object.jsonName + "_" + key;
            var element_id = await Transportation.insertTransportation(element);
            break;
          case "Road":
            element["name"] = object.jsonName + "_" + key;
            var element_id = await Transportation.insertTransportation(element);
            break;
          case "SolitaryVegetationObject":
            element["name"] = object.jsonName + "_" + key;
            var element_id = await SolitaryVegetationObject.insertSolitaryVegetationObject(
              element
            );
            break;
          case "TINRelief":
            element["name"] = object.jsonName + "_" + key; // Add a reference to the building for the client - attribute in document
            var element_id = await TINRelief.insertTINRelief(element);
            break;
          case "TransportSquare":
            element["name"] = object.jsonName + "_" + key;
            var element_id = await Transportation.insertTransportation(element);
            break;
          case "Tunnel":
          case "TunnelPart":
            element["name"] = object.jsonName + "_" + key;
            var element_id = await Tunnel.insertTunnel(element);
            break;
          case "TunnelInstallation":
            element["name"] = object.jsonName + "_" + key;
            var element_id = await Tunnel.insertTunnelInstallation(element);
            break;
          case "WaterBody":
            element["name"] = object.jsonName + "_" + key;
            var element_id = await WaterBody.insertWaterBody(element);
            break;
          default:
            throw new Error("insertCity: " + key + " is not a CityObject.");
        }

        var cityobject = {};

        cityobject["id"] = element_id;
        cityobject["type"] = element.type;
      } catch (err) {
        console.warn(err.message);
      }

      new_objects[object.jsonName + "_" + key] = cityobject; // Add a reference to the building for the client - name of document
    }

    object.json.CityObjects = new_objects;

    var city = new CityModel(object.json);

    await city.save(function(err, element) {
      if (err) return console.error(err.message);
    });

    return console.log("insertCity: CityModel inserted.");
  },
  Model: CityModel,
  Schema: CityModelSchema
};
