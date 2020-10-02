let mongoose = require("mongoose");

let Appearance = require("./appearance.js");
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
  version: {
    type: String,
    default: "1.0.1",
    required: true,
    validate: /^([0-9]\.)+([0-9])$/
  },
  CityObjects: { type: {}, required: true }, // No need of rules and schemas as it is already handled in the insertCity function
  vertices: {
    type: [[Number]],
    required: true,
    index: true,
    validate: function() {
      for (var vertex in this.vertices) {
        if (this.vertices[vertex].length != 3) return false;
      }
      return true;
    }
  },
  extension: {
    url: {
      type: String,
      required: function() {
        return this.hasOwnProperty("extension") && validURL(this.url);
      }
    },
    version: {
      type: String,
      validate: /^([0-9]\.)+([0-9])$/,
      required: function() {
        return this.hasOwnProperty("extension");
      }
    }
  },
  metadata: {
    filesize: String,
    nbr_el: Number,
    geographicalExtent: { type: [Number], default: undefined },
    referenceSystem: {
      type: String,
      default: "urn:ogc:def:crs:EPSG::4326",
      required: true
    },
    contactDetails: {
      contactName: {
        type: String
      },
      phone: {
        type: String
      },
      address: {
        type: String
      },
      emailAddress: {
        type: String,
        validate: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      },
      contactType: {
        type: String,
        enum: ["individual", "organization"],
        role: {
          type: String,
          enum: [
            "resourceProvider",
            "custodian",
            "owner",
            "user",
            "distributor",
            "originator",
            "pointOfContact",
            "principalInvestigator",
            "processor",
            "publisher",
            "author",
            "sponsor",
            "co-author",
            "collaborator",
            "editor",
            "mediator",
            "rightsHolder",
            "contributor",
            "funder",
            "stakeholder"
          ]
        },
        organization: String,
        website: {
          validate: /^http(s)?:.*/
        }
      }
    }
  },
  transform: {
    // No additional properties
    scale: {
      type: [Number],
      default: undefined,
      validate: function() {
        return this.transform["scale"].length == 3;
      }
    },
    translate: {
      type: [Number],
      default: undefined,
      validate: function() {
        return this.transform["translate"].length == 3;
      }
    }
  },
  appearance: {
    // No additional properties
    "default-theme-texture": String,
    "default-theme-material": String,
    materials: {
      type: [mongoose.model("Material").schema],
      default: undefined
    },
    texture: { type: [mongoose.model("Texture").schema], default: undefined },
    "vertices-texture": { type: [[Number]], default: undefined } //length == 2
  },
  "geometry-templates": {
    // No additional properties
    templates: {
      type: [mongoose.model("GeometryInstance").schema],
      default: undefined
    },
    "vertices-template": {
      type: [[Number]],
      default: undefined,
      validate: function() {
        for (var vertex in this["geometry-templates"]["vertices-template"]) {
          if (
            this["geometry-templates"]["vertices-template"][vertex].length != 3
          )
            return false;
        }
        return true;
      }
    }
  }
});

CityModel = mongoose.model("CityModel", CityModelSchema);

module.exports = {
  insertCity: async object => {
    var new_objects = {};

    object.json["name"] = object.jsonName;

    for ([key, element] of Object.entries(object.json.CityObjects)) {
      var min_vertices = Infinity,
        max_vertices = -Infinity;

      // Help extracting vertices between the min and max index in all geometries
      for (var geom_id in element.geometry) {
        [min_vertices, max_vertices] = getExtreme(
          element.geometry[geom_id].boundaries,
          min_vertices,
          max_vertices
        );
      }

      // Extract only the relevant vertices for the CityObject
      var sub_vertices = object.json.vertices.slice().splice( // Makes a copy without altering the vertices
        min_vertices,
        max_vertices - min_vertices + 1
      );

      // Populate geometries with the real vertices instead of indexes
      for (geom_id in element.geometry) {
        element.geometry[geom_id].boundaries = switchGeometry(
          element.geometry[geom_id].boundaries,
          min_vertices
        );
      }

      element.vertices = sub_vertices

      try {
        switch (element.type) {
          case "Building":
          case "BuildingPart":
            element["name"] = object.jsonName + "_" + key;
            var element_id = await Building.insertBuilding(
              element,
              object.jsonName
            );
            break;
          case "BuildingInstallation":
            element["name"] = object.jsonName + "_" + key;
            var element_id = await Building.insertBuildingInstallation(
              element,
              object.jsonName
            );
            break;
          case "Bridge":
          case "BridgePart":
            element["name"] = object.jsonName + "_" + key;
            var element_id = await Bridge.insertBridge(
              element,
              object.jsonName
            );
            break;
          case "BridgeInstallation":
          case "BridgeConstructionElement":
            element["name"] = object.jsonName + "_" + key;
            var element_id = await Bridge.insertBridgeInstallation(
              element,
              object.jsonName
            );
            break;
          case "CityObjectGroup":
            element["name"] = object.jsonName + "_" + key;
            var element_id = await CityObjectGroup.insertCityObjectGroup(
              element,
              object.jsonName
            );
            break;
          case "CityFurniture":
            element["name"] = object.jsonName + "_" + key;
            var element_id = await CityFurniture.insertCityFurniture(
              element,
              object.jsonName
            );
            break;
          case "GenericCityObject":
            element["name"] = object.jsonName + "_" + key;
            var element_id = await GenericCityObject.insertGenericCityObject(
              element,
              object.jsonName
            );
            break;
          case "LandUse":
            element["name"] = object.jsonName + "_" + key;
            var element_id = await LandUse.insertLandUse(
              element,
              object.jsonName
            );
            break;
          case "PlantCover":
            element["name"] = object.jsonName + "_" + key;
            var element_id = await PlantCover.insertPlantCover(
              element,
              object.jsonName
            );
            break;
          case "Railway":
            element["name"] = object.jsonName + "_" + key;
            var element_id = await Transportation.insertTransportation(
              element,
              object.jsonName
            );
            break;
          case "Road":
            element["name"] = object.jsonName + "_" + key;
            var element_id = await Transportation.insertTransportation(
              element,
              object.jsonName
            );
            break;
          case "SolitaryVegetationObject":
            continue;
            /*
            element["name"] = object.jsonName + "_" + key;
            var element_id = await SolitaryVegetationObject.insertSolitaryVegetationObject(
              element,
              object.jsonName
            );
            */

            break;
          case "TINRelief":
            element["name"] = object.jsonName + "_" + key; // Add a reference to the building for the client - attribute in document
            var element_id = await TINRelief.insertTINRelief(
              element,
              object.jsonName
            );
            break;
          case "TransportSquare":
            element["name"] = object.jsonName + "_" + key;
            var element_id = await Transportation.insertTransportation(
              element,
              object.jsonName
            );
            break;
          case "Tunnel":
          case "TunnelPart":
            element["name"] = object.jsonName + "_" + key;
            var element_id = await Tunnel.insertTunnel(
              element,
              object.jsonName
            );
            break;
          case "TunnelInstallation":
            element["name"] = object.jsonName + "_" + key;
            var element_id = await Tunnel.insertTunnelInstallation(
              element,
              object.jsonName
            );
            break;
          case "WaterBody":
            element["name"] = object.jsonName + "_" + key;
            var element_id = await WaterBody.insertWaterBody(
              element,
              object.jsonName
            );
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
    object.json.vertices = [] // Can be emptied as vertices are in CityObjects now

    var city = new CityModel(object.json);

    await city.save();
  },
  Model: CityModel,
  Schema: CityModelSchema
};

function validURL(str) {
  var pattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocol
    "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
    "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
    "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
    "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  ); // fragment locator
  return !!pattern.test(str);
}

function getExtreme(array, min, max) {
  for (var el in array) {
    if (array[el].constructor === Array)
      [min, max] = getExtreme(array[el], min, max);
    if (array[el] > max) max = array[el];
    if (array[el] < min) min = array[el];
  }
  return [min, max];
}

function switchGeometry(array, min_index) {
  for (var el in array) {
    if (array[el].constructor === Array) {
      array[el] = switchGeometry(array[el], min_index);
    } else {
      array[el] = array[el] - min_index;
    }
  }
  return array;
}
