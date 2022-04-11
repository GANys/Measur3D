let mongoose = require("mongoose");
const axios = require("axios");
let proj4 = require("proj4");

let Geometry = require("./geometry.js");
let CityObject = require("./abstractcityobject.js");
let Appearance = require("./appearance.js");

let Building = require("./building.js");
let Bridge = require("./bridge.js");
let CityFurniture = require("./cityfurniture.js");
let CityObjectGroup = require("./cityobjectgroup.js");
let LandUse = require("./landuse.js");
let OtherConstruction = require("./otherconstruction.js");
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
 *           - uid
 *           - type
 *           - version
 *           - CityObjects
 *           - vertices
 *           - transform
 *         properties:
 *           uid:
 *             type: string
 *             description: Unique identifier of the CityModel (not its UUID) - created by the method '#/Measur3D/uploadCityModel'. Basically the name of the uploaded file.
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
 *               '#/AbstractCityObject/uid':
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
 *               identifier:
 *                 type: string
 *                 description: A unique identifier for the dataset. It is recommend to use universally unique identifier, but it is not necessary.
 *               geographicalExtent:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: An array with 6 values - [minx, miny, minz, maxx, maxy, maxz].
 *               referenceDate:
 *                 type: string
 *                 description: The date where the dataset was compiled, without the time of the day, only a "full-date" in RFC 3339, Section 5.6 should be used.
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
 *                 format: URL
 *                 description: A string that defines a coordinate reference system. Note that all CityObjects need to have the same CRS (http://www.opengis.net/def/crs/authority/version/code).
 *               title:
 *                 type: string
 *                 description: A string describing the dataset.
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
 *             description: A JSON object that may have different information giving information on the CityModel (limited to these 6).
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
  type: { type: String, default: "CityJSON", required: true },
  uid: { type: String, required: true },
  version: {
    type: String,
    default: "1.1",
    required: true,
    validate: /^([0-9]\.)+([0-9])$/,
  },
  CityObjects: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CityObject",
      // ref: 'Post',
      required: true,
      index: true,
    },
  ],
  extensions: {
    url: {
      type: String,
      required: function () {
        return this.hasOwnProperty("extension") && validURL(this.url);
      },
    },
    version: {
      type: String,
      validate: /^([0-9]\.)+([0-9])$/,
      required: function () {
        return this.hasOwnProperty("extension");
      },
    },
  },
  metadata: {
    identifier: { type: String },
    geographicalExtent: { type: [Number], default: undefined },
    title: { type: String },
    referenceSystem: {
      type: String,
      default: "https://www.opengis.net/def/crs/EPSG/0/4326",
      required: true,
    },
    referenceDate: { type: Date },
    pointOfContact: {
      contactName: {
        type: String,
      },
      phone: {
        type: String,
      },
      address: {
        type: String,
      },
      emailAddress: {
        type: String,
        validate: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
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
            "stakeholder",
          ],
        },
        organization: String,
        website: {
          validate: /^http(s)?:.*/,
        },
      },
    },
    location: {
      type: { type: String, enum: "Polygon" },
      coordinates: { type: [[[Number]]] },
    },
  },
  vertices: [],
  transform: {
    type: {
      scale: {
        type: [Number],
        default: undefined,
        validate: function () {
          return this["scale"].length == 3;
        },
      },
      translate: {
        type: [Number],
        default: undefined,
        validate: function () {
          return this["translate"].length == 3;
        },
      },
    },
    required: true,
  },
  appearance: {
    // No additional properties
    "default-theme-texture": String,
    "default-theme-material": String,
    materials: {
      type: [mongoose.model("Material").schema],
      default: undefined,
    },
    textures: { type: [mongoose.model("Texture").schema], default: undefined },
    "vertices-texture": { type: [[Number]], default: undefined }, //length == 2
  },
  "geometry-templates": {
    // No additional properties
    templates: {
      type: [mongoose.model("GeometryInstance").schema],
      default: undefined,
    },
    "vertices-templates": {
      type: [[Number]],
      default: undefined,
      validate: function () {
        for (var vertex in this["geometry-templates"]["vertices-template"]) {
          if (
            this["geometry-templates"]["vertices-template"][vertex].length != 3
          )
            return false;
        }
        return true;
      },
    },
  },
});

CityModel = mongoose.model("CityModel", CityModelSchema);

module.exports = {
  insertCity: async (cm_uid, citymodel) => {
    return new Promise(async function (resolve, reject) {
      citymodel["uid"] = cm_uid;
      /*
   var new_objects = {};
   var objectPromises = [];

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

     proj4.defs("currentProj", proj_string.data);

     location = {
       type: "Polygon",
       coordinates: [
         [
           proj4("currentProj", "WGS84", [min_x, min_y]),
           proj4("currentProj", "WGS84", [min_x, max_y]),
           proj4("currentProj", "WGS84", [max_x, max_y]),
           proj4("currentProj", "WGS84", [max_x, min_y]),
           proj4("currentProj", "WGS84", [min_x, min_y]),
         ],
       ],
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
           [min_x, min_y],
         ],
       ],
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
     max_z,
   ];

   await Promise.all(objectPromises);

   object.json.CityObjects = new_objects;
   object.json.vertices = []; // Can be emptied as vertices are in CityObjects now
   object.json["geometry-templates"] = {}; // Can be emptied as geometries have been updated in the objects



   // Build 2D index
   //mongoose.model("CityObject").schema.index({ location: '2dsphere' });
   */

      var temp_keys = [];
      var temp_objects = [];

      for ([key, element] of Object.entries(citymodel.CityObjects)) {
        temp_keys.push(key);
        temp_objects.push(saveCityObject(citymodel, element));
      }

      Promise.allSettled(temp_objects).then((resolved_objects) => {
        var cityobjects = [];
        for (var i in resolved_objects) {
          if (resolved_objects[i].status == "rejected") {
            console.log(resolved_objects[i].reason);
          } else {
            cityobjects.push(resolved_objects[i].value);
          }
        }

        citymodel.CityObjects = cityobjects;
        citymodel.vertices = [];

        var city = new CityModel(citymodel);

        try {
          city.save().then((data) => {
            resolve("/uploadCityModel : Citymodel saved");
          });
        } catch (err) {
          console.error(err.message);
        }
      });
    });
  },
  Model: CityModel,
  Schema: CityModelSchema,
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

async function saveCityObject(citymodel, object) {
  return new Promise(async function (resolve, reject) {
    var min_index = Infinity,
      max_index = -Infinity;

    var min_x = Infinity,
      max_x = -Infinity,
      min_y = Infinity,
      max_y = -Infinity,
      min_z = Infinity,
      max_z = -Infinity;

    object.vertices = [];

    // Help extracting vertices between the min and max index in all geometries
    // It is the complex part
    for (var geometry in object.geometry) {
      if (object.geometry[geometry].type == "GeometryInstance") {
        // Deep clone of a template - Shallow copy create to much problems afterwards
        var instance = await Geometry.getGeometryInstance(
          JSON.parse(JSON.stringify(object.geometry[geometry])),
          JSON.parse(
            JSON.stringify(
              citymodel["geometry-templates"].templates[
                object.geometry[geometry].template
              ]
            )
          ),
          citymodel.vertices,
          citymodel.transform,
          citymodel["geometry-templates"]["vertices-templates"]
        );

        object.geometry[geometry] = instance[0];
        object.vertices = object.vertices.concat(instance[1]);
      } else {
        [min_index, max_index] = getExtreme(
          object.geometry[geometry].boundaries,
          min_index,
          max_index
        );

        // Extract only the relevant vertices for the CityObject
        object.vertices = citymodel.vertices.slice().splice(
          // Slice() makes a deep copy
          min_index,
          max_index - min_index + 1
        );

        // Populate geometries with the real vertices instead of indexes
        object.geometry[geometry].boundaries = switchGeometry(
          object.geometry[geometry].boundaries,
          min_index
        );
      }
    }

    for (ver in object.vertices) {
      if (object.vertices[ver][0] > max_x) max_x = object.vertices[ver][0];
      if (object.vertices[ver][0] < min_x) min_x = object.vertices[ver][0];
      if (object.vertices[ver][1] > max_y) max_y = object.vertices[ver][1];
      if (object.vertices[ver][1] < min_y) min_y = object.vertices[ver][1];
      if (object.vertices[ver][2] > max_z) max_z = object.vertices[ver][2];
      if (object.vertices[ver][2] < min_z) min_z = object.vertices[ver][2];
    }

    // Stores real coordinates in BBOX
    if (citymodel.transform != undefined) {
      min_x =
        min_x * citymodel.transform.scale[0] + citymodel.transform.translate[0];
      max_x =
        max_x * citymodel.transform.scale[0] + citymodel.transform.translate[0];
      min_y =
        min_y * citymodel.transform.scale[1] + citymodel.transform.translate[1];
      max_y =
        max_y * citymodel.transform.scale[1] + citymodel.transform.translate[1];
      min_z =
        min_z * citymodel.transform.scale[2] + citymodel.transform.translate[2];
      max_z =
        max_z * citymodel.transform.scale[2] + citymodel.transform.translate[2];
    }

    object.geographicalExtent = [min_x, min_y, min_z, max_x, max_y, max_z];

    object.transform = citymodel.transform;

    try {
      var epsg_code = citymodel.metadata.referenceSystem;
    } catch (err) {
      console.warn(
        "No reference have been provided. SpatialIndex wont be used for object : " +
          key
      );
    }

    var reg = /\d/g; // Only numbers

    var location;
    /*

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
              proj4("currentProj", "WGS84", [min_x, min_y]),
            ],
          ],
        };

        object.spatialIndex = true;
      } else {
      */
    location = {
      type: "Polygon",
      coordinates: [
        [
          [min_x, min_y],
          [min_x, max_y],
          [max_x, max_y],
          [max_x, min_y],
          [min_x, min_y],
        ],
      ],
    };

    object.spatialIndex = false;
    //}

    object.location = location;

    object["uid"] = key;

    var temp_object_id;

    try {
      switch (object.type) {
        case "Building":
        case "BuildingPart":
          temp_object_id = await Building.insertBuilding(object);
          break;
        case "BuildingInstallation":
          temp_object_id = await Building.insertBuildingInstallation(object);
          break;
        case "Bridge":
        case "BridgePart":
          temp_object_id = await Bridge.insertBridge(object);
          break;
        case "BridgeInstallation":
        case "BridgeConstructiveElement":
          temp_object_id = await Bridge.insertBridgeInstallation(object);
          break;
        case "CityObjectGroup":
          return reject(
            "insertCity: " + object.type + " is not supported yet."
          );
          /*
          temp_object_id = await CityObjectGroup.insertCityObjectGroup(object);
         */
          break;
        case "CityFurniture":
          temp_object_id = await CityFurniture.insertCityFurniture(object);
          break;
        case "LandUse":
          temp_object_id = await LandUse.insertLandUse(object);
          break;
        case "PlantCover":
          temp_object_id = await PlantCover.insertPlantCover(object);
          break;
        case "Railway":
          temp_object_id = await Transportation.insertTransportation(object);
          break;
        case "Road":
          temp_object_id = await Transportation.insertTransportation(object);
          break;
        case "SolitaryVegetationObject":
          temp_object_id = await SolitaryVegetationObject.insertSolitaryVegetationObject(
            object
          );
          break;
        case "TINRelief":
          temp_object_id = await TINRelief.insertTINRelief(object);
          break;
        case "TransportSquare":
          temp_object_id = await Transportation.insertTransportation(object);
          break;
        case "Tunnel":
        case "TunnelPart":
          temp_object_id = await Tunnel.insertTunnel(object);
          break;
        case "TunnelInstallation":
          temp_object_id = await Tunnel.insertTunnelInstallation(object);
          break;
        case "WaterBody":
          temp_object_id = await WaterBody.insertWaterBody(object);
          break;
        default:
          return reject(
            "/uploadCityModel : " +
              key +
              " is not a supported CityObject (" +
              object.type +
              ")."
          );
      }

      resolve(mongoose.Types.ObjectId(temp_object_id));
    } catch (err) {
      console.warn(err.message);
    }
  });
}
