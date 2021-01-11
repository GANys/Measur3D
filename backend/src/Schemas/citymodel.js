let mongoose = require("mongoose");
const axios = require("axios");
let proj4 = require("proj4");

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

/**
 *  @swagger
 *   components:
 *     schemas:
 *       CityModel:
 *         type: object
 *         required:
 *           - name
 *           - type
 *           - version
 *           - CityObjects
 *           - vertices
 *         properties:
 *           name:
 *             type: string
 *             description: Unique name of the CityModel (not its UUID) - created by the method '#/Measur3D/uploadCityModel'. Basically the name of the uploaded file.
 *           type:
 *             type: string
 *             default: CityJSON
 *             description: Imposed.
 *           version:
 *             type: string
 *             description: A string with the version (X.Y) of CityJSON used. Minor versions are not considered.
 *           CityObjects:
 *             type: object
 *             properties:
 *               '#/AbstractCityObject/name':
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: UUID id of the document in the database.
 *                   type:
 *                     type: string
 *                     description: Type of the CityObject.
 *             description: A collection of key-value pairs, where the key is the name of the CityObject, and the value is couple of key giving the object id and its type.
 *           vertices:
 *             type: array
 *             items:
 *               type: string
 *             description: Remains of the initial CityJSON specs. Vertices are now stored in '#/AbstractCityObject'. Should be empty.
 *           extension:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 format: URL
 *                 description: External link to the ressource.
 *               version:
 *                 type: string
 *                 description: Version of the extension.
 *             description: A JSON file that allows us to document how the core data model of CityJSON may be extended, and to validate CityJSON files.
 *           metadata:
 *             type: object
 *             properties:
 *               filesize:
 *                 type: number
 *                 description: Size of the CityJSON file in bits - created by the method '#/Measur3D/uploadCityModel'.
 *               nbr_el:
 *                 type: number
 *                 descrption: Number of AbstractCityObject in the CityModel.
 *               geographicalExtent:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: An array with 6 values - [minx, miny, minz, maxx, maxy, maxz].
 *               spatialIndex:
 *                 type: boolean
 *                 description: A boolean specifiying if the object is spatially indexed or not.
 *               location:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     default: ['Polygon']
 *                   coordinates:
 *                     type: string
 *                     format: ISO19107
 *                 description: A hierarchy of arrays following the ISO19107 standard. Duplicate information of the '#/geographicalExtent'. Useful in order to index objects spatialy.
 *               referenceSystem:
 *                 type: string
 *                 format: OGC CRS URN
 *                 description: A string that defines a coordinate reference system. Note that all CityObjects need to have the same CRS.
 *               contactDetails:
 *                 type: object
 *                 properties:
 *                   contactName:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   address:
 *                     type: string
 *                   emailAddress:
 *                     type: string
 *                   contactType:
 *                     type: string
 *                     enums: [individual, organization]
 *             description: A JSON object that may have different members giving information on the CityModel.
 *           transform:
 *             type: object
 *             required:
 *               - scale
 *               - translate
 *             properties:
 *               scale:
 *                 type: array
 *                 items:
 *                   type: number
 *               translate:
 *                 type: array
 *                 items:
 *                   type: number
 *             description: Scale factor and the translation needed to obtain the original coordinates from the integer vertices (stored with floats/doubles).
 *           appearance:
 *             type: object
 *             properties:
 *               default-theme-texture:
 *                 type: string
 *               default-theme-material:
 *                 type: string
 *               materials:
 *                 type: array
 *                 items:
 *                   $ref: '#components/schemas/Material'
 *               textures:
 *                 type: array
 *                 items:
 *                   $ref: '#components/schemas/Texture'
 *               vertices-texture:
 *                 type: array
 *                 items:
 *                   type: array
 *                   items:
 *                     type: number
 *             description: JSON objects representing the textures and/or materials of surfaces.
 *           geometry-templates:
 *             type: object
 *             properties:
 *               templates:
 *                 type: object
 *                 description: Need to rework the GeometryInstance.
 *               vertices-template:
 *                 type: array
 *                 items:
 *                   type: array
 *                   items:
 *                     type: number
 *             description: The date of the record creation.
 */

let CityModelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, default: "CityJSON", required: true },
  version: {
    type: String,
    default: "1.0",
    required: true,
    validate: /^([0-9]\.)+([0-9])$/
  },
  CityObjects: { type: {}, required: true, index: true }, // No need of rules and schemas as it is already handled in the insertCity function
  vertices: {},
  extensions: {
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
    location: {
      type: { type: String, enum: "Polygon" },
      coordinates: { type: [[[Number]]] }
    },
    spatialIndex: { type: Boolean, default: false },
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
    textures: { type: [mongoose.model("Texture").schema], default: undefined },
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
    var objectPromises = [];

    object.json["name"] = object.jsonName;

    var min_x = Infinity,
      max_x = -Infinity,
      min_y = Infinity,
      max_y = -Infinity,
      min_z = Infinity,
      max_z = -Infinity;

    for ([key, element] of Object.entries(object.json.CityObjects)) {
      var result = await saveCityObject(object, element);

      if (result.object === undefined) continue;

      objectPromises.push(result.object);

      new_objects[object.jsonName + "_" + key] = result.object;

      console.log(result.bbox)

      if (result.bbox[3] > max_x) max_x = result.bbox[3];
      if (result.bbox[0] < min_x) min_x = result.bbox[0];
      if (result.bbox[4] > max_y) max_y = result.bbox[4];
      if (result.bbox[1] < min_y) min_y = result.bbox[1];
      if (result.bbox[5] > max_z) max_z = result.bbox[5];
      if (result.bbox[2] < min_z) min_z = result.bbox[2];
    }

    if (object.json.metadata == undefined) {
      object.json.metadata = {};
    }

    var epsg_code = object.json.metadata.referenceSystem;

    var reg = /\d/g; // Only numbers

    var location;

    if (epsg_code != undefined) {
      var epsgio =
        "https://epsg.io/" + epsg_code.match(reg).join("") + ".proj4";

      var proj_string = await axios.get(epsgio);

      console.log(epsg_code)

      proj4.defs("currentProj", proj_string.data);

      location = {
        type: "Polygon",
        coordinates: [
          [
            proj4("currentProj", "WGS84", [min_x, min_y]),
            proj4("currentProj", "WGS84", [min_x, max_y]),
            proj4("currentProj", "WGS84", [max_x, max_y]),
            proj4("currentProj", "WGS84", [max_x, min_y]),
            proj4("currentProj", "WGS84", [min_x, min_y])
          ]
        ]
      };

      object.json.metadata.spatialIndex = true;
    } else {
      location = {
        type: "Polygon",
        coordinates: [
          [
            [min_x, min_y],
            [min_x, max_y],
            [max_x, max_y],
            [max_x, min_y],
            [min_x, min_y]
          ]
        ]
      };

      object.json.metadata.spatialIndex = false;
    }

    object.json.metadata.location = location;

    // Real citymodel bbox
    object.json.metadata.geographicalExtent = [
      min_x,
      min_y,
      min_z,
      max_x,
      max_y,
      max_z
    ];

    await Promise.all(objectPromises);

    object.json.CityObjects = new_objects;
    object.json.vertices = []; // Can be emptied as vertices are in CityObjects now

    var city = new CityModel(object.json);

    // Build 2D index
    //mongoose.model("CityObject").schema.index({ location: '2dsphere' });

    await city.save();

    return;
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

async function saveCityObject(object, element) {
  var min_index = Infinity,
    max_index = -Infinity;

  var min_x = Infinity,
    max_x = -Infinity,
    min_y = Infinity,
    max_y = -Infinity,
    min_z = Infinity,
    max_z = -Infinity;

  // Help extracting vertices between the min and max index in all geometries
  // It is the complex part
  for (var geom_id in element.geometry) {
    [min_index, max_index] = getExtreme(
      element.geometry[geom_id].boundaries,
      min_index,
      max_index
    );
  }

  // Extract only the relevant vertices for the CityObject
  element.vertices = object.json.vertices.slice().splice(
    // Makes a copy without altering the vertices
    min_index,
    max_index - min_index + 1
  );

  for (ver in element.vertices) {
    if (element.vertices[ver][0] > max_x) max_x = element.vertices[ver][0];
    if (element.vertices[ver][0] < min_x) min_x = element.vertices[ver][0];
    if (element.vertices[ver][1] > max_y) max_y = element.vertices[ver][1];
    if (element.vertices[ver][1] < min_y) min_y = element.vertices[ver][1];
    if (element.vertices[ver][2] > max_z) max_z = element.vertices[ver][2];
    if (element.vertices[ver][2] < min_z) min_z = element.vertices[ver][2];
  }

  // Stores real coordinates in BBOX
  if (object.json.transform != undefined) {
    min_x =
      min_x * object.json.transform.scale[0] +
      object.json.transform.translate[0];
    max_x =
      max_x * object.json.transform.scale[0] +
      object.json.transform.translate[0];
    min_y =
      min_y * object.json.transform.scale[1] +
      object.json.transform.translate[1];
    max_y =
      max_y * object.json.transform.scale[1] +
      object.json.transform.translate[1];
    min_z =
      min_z * object.json.transform.scale[2] +
      object.json.transform.translate[2];
    max_z =
      max_z * object.json.transform.scale[2] +
      object.json.transform.translate[2];
  }

  element.geographicalExtent = [min_x, min_y, min_z, max_x, max_y, max_z];

  element.transform = object.json.transform;

  var epsg_code = object.json.metadata.referenceSystem;

  var reg = /\d/g; // Only numbers

  var location;

  if (epsg_code != undefined) {
    var epsgio = "https://epsg.io/" + epsg_code.match(reg).join("") + ".proj4";

    var proj_string = await axios.get(epsgio);

    proj4.defs("currentProj", proj_string.data);

    location = {
      type: "Polygon",
      coordinates: [
        [
          proj4("currentProj", "WGS84", [min_x, min_y]),
          proj4("currentProj", "WGS84", [min_x, max_y]),
          proj4("currentProj", "WGS84", [max_x, max_y]),
          proj4("currentProj", "WGS84", [max_x, min_y]),
          proj4("currentProj", "WGS84", [min_x, min_y])
        ]
      ]
    };

    element.spatialIndex = true;
  } else {
    location = {
      type: "Polygon",
      coordinates: [
        [
          [min_x, min_y],
          [min_x, max_y],
          [max_x, max_y],
          [max_x, min_y],
          [min_x, min_y]
        ]
      ]
    };

    element.spatialIndex = false;
  }

  element.location = location;

  // Populate geometries with the real vertices instead of indexes
  for (geom_id in element.geometry) {
    element.geometry[geom_id].boundaries = switchGeometry(
      element.geometry[geom_id].boundaries,
      min_index
    );
  }

  try {
    switch (element.type) {
      case "Building":
      case "BuildingPart":
        element["name"] = object.jsonName + "_" + key;
        var element_id = Building.insertBuilding(element, object.jsonName);
        break;
      case "BuildingInstallation":
        element["name"] = object.jsonName + "_" + key;
        var element_id = Building.insertBuildingInstallation(
          element,
          object.jsonName
        );
        break;
      case "Bridge":
      case "BridgePart":
        element["name"] = object.jsonName + "_" + key;
        var element_id = Bridge.insertBridge(element, object.jsonName);
        break;
      case "BridgeInstallation":
      case "BridgeConstructionElement":
        element["name"] = object.jsonName + "_" + key;
        var element_id = Bridge.insertBridgeInstallation(
          element,
          object.jsonName
        );
        break;
      case "CityObjectGroup":
        element["name"] = object.jsonName + "_" + key;
        var element_id = CityObjectGroup.insertCityObjectGroup(
          element,
          object.jsonName
        );
        break;
      case "CityFurniture":
        element["name"] = object.jsonName + "_" + key;
        var element_id = CityFurniture.insertCityFurniture(
          element,
          object.jsonName
        );
        break;
      case "GenericCityObject":
        element["name"] = object.jsonName + "_" + key;
        var element_id = GenericCityObject.insertGenericCityObject(
          element,
          object.jsonName
        );
        break;
      case "LandUse":
        element["name"] = object.jsonName + "_" + key;
        var element_id = LandUse.insertLandUse(element, object.jsonName);
        break;
      case "PlantCover":
        element["name"] = object.jsonName + "_" + key;
        var element_id = PlantCover.insertPlantCover(element, object.jsonName);
        break;
      case "Railway":
        element["name"] = object.jsonName + "_" + key;
        var element_id = Transportation.insertTransportation(
          element,
          object.jsonName
        );
        break;
      case "Road":
        element["name"] = object.jsonName + "_" + key;
        var element_id = Transportation.insertTransportation(
          element,
          object.jsonName
        );
        break;
      case "SolitaryVegetationObject":
        return { object: undefined, bbox: undefined };
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
        var element_id = TINRelief.insertTINRelief(element, object.jsonName);
        break;
      case "TransportSquare":
        element["name"] = object.jsonName + "_" + key;
        var element_id = Transportation.insertTransportation(
          element,
          object.jsonName
        );
        break;
      case "Tunnel":
      case "TunnelPart":
        element["name"] = object.jsonName + "_" + key;
        var element_id = Tunnel.insertTunnel(element, object.jsonName);
        break;
      case "TunnelInstallation":
        element["name"] = object.jsonName + "_" + key;
        var element_id = Tunnel.insertTunnelInstallation(
          element,
          object.jsonName
        );
        break;
      case "WaterBody":
        element["name"] = object.jsonName + "_" + key;
        var element_id = WaterBody.insertWaterBody(element, object.jsonName);
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

  return { object: cityobject, bbox: element.geographicalExtent };
}
