var express = require("express");
var router = express.Router();
const mongoose = require("mongoose");
var url = require("url");
var fs = require("fs");
var negoc = require("./contentNegotiation");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const yaml = require("js-yaml");

//-------------------------------------------------------------------------------------
// Web caching Middleware - clear after 15 minutes

var cache = {};

var cacheMetadata = [];

function push(key) {
  cacheMetadata.push({
    value: key,
    time: Date.now(),
  });
}

setInterval(function () {
  var time = Date.now();

  cacheMetadata = cacheMetadata.filter(function (item) {
    if (time < item.time + 1000 * 60 * 15) {
      return true;
    } else {
      delete cache[item.value];
      return false;
    }
  });
}, 1000 * 60 * 15);

var midWareCaching = (req, res, next) => {
  const key = req.url;
  if (cache[key]) {
    for (var i = 0; i < cacheMetadata.length; i++) {
      if (cacheMetadata[i].value === key) {
        cacheMetadata[i].time = Date.now();
      }
    }

    if (cache[key][0] == "{") {
      // JSON
      res.json(JSON.parse(cache[key]));
    } else if (cache[key][0] == "<") {
      // HTML
      res.send(cache[key]);
    } else {
      // Need to find a solution for YAML
      res.setHeader("Content-Type", "text/plain");
      res.send(cache[key]);
    }
  } else {
    res.sendResponse = res.send;
    res.send = (body) => {
      cache[key] = body;
      res.sendResponse(body);
    };
    push(key);
    next();
  }
};

//-------------------------------------------------------------------------------------

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Measur3D : OGC API - Features",
      version: "0.3.0",
      description:
        "A RESTful API to access CityJSON features compliing with OGC API - Features: Core (Part 1).",
      license: {
        name: "Apache-2.0",
        url: "https://www.apache.org/licenses/LICENSE-2.0",
      },
      contact: {
        name: "Gilles-Antoine Nys",
        email: "ganys@uliege.be",
      },
    },
    servers: [
      {
        url: "http://localhost:3001/features",
        description: "OGC API - Features",
      },
    ],
    tags: ["Features"],
  },
  apis: ["./routes/features.js"],
};

const specs = swaggerJsdoc(options);

//-------------------------------------------------------------------------------------

/**
 *  @swagger
 *   components:
 *     tags: [Measur3D]
 *     schemas:
 *       CityJSONFeature:
 *         type: object
 *         required:
 *           - type
 *           - uid
 *           - CityObjects
 *           - vertices
 *         properties:
 *           type:
 *             type: string
 *             default: "CityJSONFeature"
 *           uid:
 *             type: string
 *             description: Reference to the 1st-level CityObject (not its UUID).
 *           CityObjects:
 *             type: object
 *             schema:
 *               $ref: '#/components/schemas/AbstractCityObject'
 *             description: An object in which a CityJSONFeature and all its related 2-nd level objects are stored.
 *           vertices:
 *             type: array
 *             items:
 *               type: array
 *               items:
 *                type: number
 *             description: An array of coordinates of each vertex of the city object. Their position in this array (0-based) is used as an index to be referenced by the Geometric Objects. The indexing mechanism of the format Wavefront OBJ is basically reused. Vertices are stored as integer (refer to #/transform).
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
 */

//-------------------------------------------------------------------------------------

router.post("*", function (req, res) {
  res.status(405).send({ error: "POST requests are not supported." });
});

/**
 * @swagger
 * /:
 *     get:
 *       summary: Access to the landing page.
 *       description: Information can be accessed in HTML or JSON formats.
 *       tags: [Features]
 *       responses:
 *         200:
 *           description: Returns the landing page of the API.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 required:
 *                   - links
 *                 properties:
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   links:
 *                     type: array
 *                     items:
 *                       $ref: http://schemas.opengis.net/ogcapi/features/part1/1.0/openapi/schemas/link.yaml
 *         400:
 *           description: Returns an error due to format.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                         example: "InvalidParameterValue"
 *                       description:
 *                         type: string
 *                         example: "Invalid format"
 */

// Can be improved once in prod
router.get("/", midWareCaching, function (req, res) {
  var contentType = "";
  var accept = req.headers.accept;

  if (accept == "application/json") contentType = "json";
  else if (accept == "text/html") contentType = "html";

  var urlParts = url.parse(req.url, true);

  // Switch on request accepted format
  if (null != urlParts.query.f) {
    if ("json" == urlParts.query.f) contentType = "json";
    else if ("html" == urlParts.query.f) contentType = "html";
    else {
      res.status(400).json({
        error: { code: "InvalidParameterValue", description: "Invalid format" },
      });
      return;
    }
  }

  // HTML is default
  if (contentType == "") contentType = "html";

  if ("json" == contentType) res.json(negoc.landing(contentType));
  else if ("html" == contentType) res.send(negoc.landing(contentType));
});

/**
 * @swagger
 * /conformance:
 *     get:
 *       summary: Access to the conformance page.
 *       description: To support "generic" clients that want to access multiple OGC API Features implementations - and not "just" a specific API / server, the server has to declare the conformance classes it implements and conforms to.
 *       tags: [Features]
 *       responses:
 *         200:
 *           description: Returns the conformance array.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 required:
 *                   - conformsTo
 *                 properties:
 *                   conformsTo:
 *                     type: array
 *                     items:
 *                       type: string
 */
router.get("/conformance", midWareCaching, function (req, res) {
  var conformance = {};

  conformance.conformsTo = [];

  conformance.conformsTo.push(
    "http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core"
  );
  conformance.conformsTo.push(
    "http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/html"
  );
  conformance.conformsTo.push(
    "http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/oas30"
  );
  conformance.conformsTo.push(
    "http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/geojson"
  );

  res.json(conformance);
});

/**
 * @swagger
 * /api:
 *     get:
 *       summary: Get the full API documentation.
 *       description: The documentation can be queried in YAML or JSON format.
 *       tags: [Features]
 *       parameters:
 *         - in: query
 *           name: f
 *           schema:
 *             type: string
 *             enum: [YAML, json]
 *             default: json
 *       responses:
 *         201:
 *           description: Full documentation of the APIs Measur3D and Features.
 *         308:
 *           description: Redirect to .html.
 *         400:
 *           description: Returns an error due to format.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                         example: "InvalidParameterValue"
 *                       description:
 *                         type: string
 *                         example: "Invalid format"
 */
router.get("/api", midWareCaching, function (req, res) {
  var urlParts = url.parse(req.url, true);

  if (null == urlParts.query.f) {
    res.setHeader("Content-Type", "application/json");
    return res.status(201).send(specs);
  } else if ("yaml" == urlParts.query.f) {
    const swaggerSpecYaml = yaml.dump(specs);
    res.setHeader("Content-Type", "text/plain");
    res.status(201).send(swaggerSpecYaml);
  } else if ("html" == urlParts.query.f) {
    res.status(308).redirect("/features/api.html");
  } else if ("json" == urlParts.query.f) {
    res.setHeader("Content-Type", "application/json");
    return res.status(201).send(specs);
  } else
    res.status(400).json({
      error: { code: "InvalidParameterValue", description: "Invalid format" },
    });
});

/**
 * @swagger
 * /api.html:
 *     get:
 *       summary: Get the API documentation as HTML.
 *       description: NOT AVAILABLE - This function allows getting a specific CityModel. It gathers all information related to the model in the different collections from the database.
 *       tags: [Features]
 */
router.get("/api.html", midWareCaching, function (req, res) {
  res.status(400).send("Not yet available");
});

/**
 * @swagger
 * /collections:
 *     get:
 *       summary: Access to the collections page - About page.
 *       description: Information can be accessed in HTML or JSON formats.
 *       tags: [Features]
 *       parameters:
 *         - in: query
 *           name: f
 *           schema:
 *             type: string
 *             enum: [HTML, json]
 *             default: HTML
 *       responses:
 *         200:
 *           description: Returns an about page on collections.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 required:
 *                   - links
 *                   - collections
 *                 properties:
 *                   links:
 *                     type: array
 *                     items:
 *                       $ref: http://schemas.opengis.net/ogcapi/features/part1/1.0/openapi/schemas/link.yaml
 *                   collections:
 *                     type: array
 *                     items:
 *                       $ref: http://schemas.opengis.net/ogcapi/features/part1/1.0/openapi/schemas/collection.yaml
 *         400:
 *           description: Returns an error due to format.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                         example: "InvalidParameterValue"
 *                       description:
 *                         type: string
 *                         example: "Invalid format"
 *         404:
 *           description: There is no collections in the database.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error:
 *                     type: string
 *                     example: There is no collection in the database.
 */
router.get("/collections", midWareCaching, function (req, res) {
  var urlParts = url.parse(req.url, true);

  mongoose
    .model("CityModel")
    .find({}, "uid metadata version extensions")
    .lean()
    .catch((err) => {
      if (err)
        return res
          .status(404)
          .send({ error: "There is no collection in the database." });
    })
    .then(async (collections) => {
      console.log(collections);
      if (null == urlParts.query.f) {
        res.send(await negoc.collections("html", collections));
      } else if ("json" == urlParts.query.f) {
        res.json(await negoc.collections("json", collections));
      } else if ("html" == urlParts.query.f)
        res.send(await negoc.collections("html", collections));
      else
        res.status(400).json({
          error: {
            code: "InvalidParameterValue",
            description: "Invalid format",
          },
        });
    });
});

/**
 * @swagger
 * /collections/:collectionId:
 *     get:
 *       summary: Get a specific collection.
 *       description: This function allows getting a specific CityModel. It gathers all information related to the model in the different collections from the database.
 *       tags: [Features]
 *       parameters:
 *         - in: query
 *           name: f
 *           schema:
 *             type: string
 *             enum: [HTML, json]
 *             default: HTML
 *         - in: path
 *           name: collectionId
 *           schema:
 *             type: string
 *       responses:
 *         200:
 *           description: Returns a collection of features and its metadata.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 $ref: http://schemas.opengis.net/ogcapi/features/part1/1.0/openapi/schemas/collection.yaml
 *         400:
 *           description: Returns an error due to format.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                         example: "InvalidParameterValue"
 *                       description:
 *                         type: string
 *                         example: "Invalid format"
 *         404:
 *           description: There is no collections in the database.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error:
 *                     type: string
 *                     example: There is no collection in the database.
 */
router.get("/collections/:collectionId", midWareCaching, function (req, res) {
  var urlParts = url.parse(req.url, true);
  mongoose
    .model("CityModel")
    .findOne(
      { uid: req.params.collectionId },
      "uid metadata version extensions"
    )
    .lean()
    .catch((err) => {
      if (err)
        return res.status(404).send({
          error:
            "There is no collection with the ID (" +
            req.params.collectionId +
            ") in the database.",
        });
    })
    .then(async (collection) => {
      if (null == urlParts.query.f)
        res.send(await negoc.collection("html", collection));
      else if ("json" == urlParts.query.f)
        res.json(await negoc.collection("json", collection));
      else if ("html" == urlParts.query.f)
        res.send(await negoc.collection("html", collection));
      else
        res.status(400).json({
          error: {
            code: "InvalidParameterValue",
            description: "Invalid format",
          },
        });
    });
});

/**
 * @swagger
 * /collections/:collectionId/items:
 *     get:
 *       summary: Get items of a specific collection.
 *       description: This function allows getting all the items of a specific collection (limited to 10 items by default).
 *       tags: [Features]
 *       parameters:
 *         - in: query
 *           name: f
 *           schema:
 *             type: string
 *             enum: [HTML, json]
 *             default: HTML
 *           style: form
 *           explode: false
 *           required: false
 *         - in: query
 *           name: limit
 *           schema:
 *             type: integer
 *             minimum: 1
 *             maximum: 10000
 *             default: 10
 *           style: form
 *           explode: false
 *           required: false
 *         - in: query
 *           name: offset
 *           schema:
 *             type: integer
 *             default: 0
 *           style: form
 *           explode: false
 *           required: false
 *         - in: query
 *           name: bbox
 *           schema:
 *             type: array
 *             minItems: 4
 *             maxItems: 6
 *             items:
 *               type: number
 *           style: form
 *           explode: false
 *           required: false
 *         - in: query
 *           name: datetime
 *           schema:
 *             type: string
 *           style: form
 *           explode: false
 *           required: false
 *         - in: query
 *           name: any
 *           description: a feature property that has a simple value (for example, a string or integer) that is expected to be useful for applications using the service to filter the features of the collection based on this property, a parameter with the name of the feature property.
 *           schema:
 *             type: string
 *           style: form
 *           explode: false
 *           required: false
 *         - in: path
 *           name: collectionId
 *           schema:
 *             type: string
 *       responses:
 *         200:
 *           description: Returns a CityModel formalised following the OGC API Features - Part 1.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 required:
 *                   - id
 *                   - links
 *                 properties:
 *                   id:
 *                     description: identifier of the collection used, for example, in URIs
 *                     type: string
 *                   title:
 *                     description: human readable title of the collection
 *                     type: string
 *                   description:
 *                     description: a description of the features in the collection
 *                     type: string
 *                   links:
 *                     type: array
 *                     items:
 *                       $ref: http://schemas.opengis.net/ogcapi/features/part1/1.0/openapi/schemas/link.yaml
 *                   extent:
 *                     description: The extent of the features in the collection. In the Core only spatial and temporal extents are specified. Extensions may add additional members to represent other extents, for example, thermal or pressure ranges.
 *                     type: object
 *                     properties:
 *                       spatial:
 *                         description: The spatial extent of the features in the collection.
 *                         type: object
 *                         properties:
 *                           bbox:
 *                             description: One or more bounding boxes that describe the spatial extent of the dataset. In the Core only a single bounding box is supported. Extensions may support additional areas. If multiple areas are provided, the union of the bounding boxes describes the spatial extent.
 *                             type: array
 *                             minItems: 1
 *                             items:
 *                               description: Each bounding box is provided as four or six numbers, depending on whether the coordinate reference system includes a vertical axis (height or depth).
 *
 *                                   * Lower left corner, coordinate axis 1
 *                                   * Lower left corner, coordinate axis 2
 *                                   * Minimum value, coordinate axis 3 (optional)
 *                                   * Upper right corner, coordinate axis 1
 *                                   * Upper right corner, coordinate axis 2
 *                                   * Maximum value, coordinate axis 3 (optional)
 *
 *                                 The coordinate reference system of the values is WGS 84 longitude/latitude (http://www.opengis.net/def/crs/OGC/1.3/CRS84) unless a different coordinate reference system is specified in `crs`.
 *                                 For WGS 84 longitude/latitude the values are in most cases the sequence of minimum longitude, minimum latitude, maximum longitude and maximum latitude. However, in cases where the box spans the antimeridian the first value (west-most box edge) is larger than the third value (east-most box edge).
 *                                 If the vertical axis is included, the third and the sixth number are the bottom and the top of the 3-dimensional bounding box.
 *                                 If a feature has multiple spatial geometry properties, it is the decision of the server whether only a single spatial geometry property is used to determine the extent or all relevant geometries.
 *                               type: array
 *                               minItems: 4
 *                               maxItems: 6
 *                               items:
 *                                 type: number
 *                           crs:
 *                             description: Coordinate reference system of the coordinates in the spatial extent (property `bbox`). The default reference system is WGS 84 longitude/latitude. In the Core this is the only supported coordinate reference system. Extensions may support additional coordinate reference systems and add additional enum values.
 *                             type: string
 *                             enum:
 *                               - 'http://www.opengis.net/def/crs/OGC/1.3/CRS84'
 *                             default: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84'
 *                       temporal:
 *                         description: The temporal extent of the features in the collection.
 *                         type: object
 *                         properties:
 *                           interval:
 *                             description: One or more time intervals that describe the temporal extent of the dataset. The value `null` is supported and indicates an open time intervall. In the Core only a single time interval is supported. Extensions may support multiple intervals. If multiple intervals are provided, the union of the intervals describes the temporal extent.
 *                             type: array
 *                             minItems: 1
 *                             items:
 *                               description: Begin and end times of the time interval. The timestamps are in the coordinate reference system specified in `trs`. By default this is the Gregorian calendar.
 *                               type: array
 *                               minItems: 2
 *                               maxItems: 2
 *                               items:
 *                                 type: string
 *                                 format: date-time
 *                                 nullable: true
 *                           trs:
 *                             description: Coordinate reference system of the coordinates in the temporal extent (property `interval`). The default reference system is the Gregorian calendar. In the Core this is the only supported temporal reference system. Extensions may support additional temporal reference systems and add additional enum values.
 *                             type: string
 *                             enum:
 *                               - 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian'
 *                             default: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian'
 *                   itemType:
 *                     description: indicator about the type of the items in the collection (the default value is 'feature').
 *                     type: string
 *                     default: feature
 *                   crs:
 *                     description: the list of coordinate reference systems supported by the service
 *                     type: array
 *                     items:
 *                       type: string
 *                       default:
 *                         - http://www.opengis.net/def/crs/OGC/1.3/CRS84
 *         400:
 *           description: Returns an error due to format. Refer the erroneous parameter.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                         example: "InvalidParameterValue"
 *                       description:
 *                         type: string
 *                         example: "Invalid # format"
 *         404:
 *           description: There is no item in the database.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error:
 *                     type: string
 *                     example: There is no item in this collection.
 *         500:
 *           description: There is no item in the database.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error:
 *                     type: string
 *                     example: There is no item in the database.
 */
router.get("/collections/:collectionId/items", midWareCaching, async function (
  req,
  res
) {
  //Next is not implemented. Might be useful in huge datasets.

  var urlParts = url.parse(req.url, true);

  var limit, offset, bbox;
  var default_limit = 10;

  if (urlParts.query.datetime != undefined) {
    return res
      .status(400)
      .send({ error: "Error: datetime is not supported yet." });

    if (
      !/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(
        String(urlParts.query.datetime)
      )
    )
      return res.status(400).send({
        error: {
          code: "InvalidParameterValue",
          description: "Invalid datetime format",
        },
      });
  }

  if (urlParts.query.limit != undefined) {
    limit = Number(urlParts.query.limit);
    if (limit == NaN || limit % 1 !== 0) {
      return res.status(400).send({
        error: {
          code: "InvalidParameterValue",
          description: "Invalid limit format",
        },
      });
    }
  } else {
    limit = default_limit;
  }

  if (urlParts.query.offset != undefined) {
    offset = Number(urlParts.query.offset);
  } else {
    offset = 0;
  }

  var find_objects = {};
  var key;

  find_objects.CityModel = req.params.collectionId;

  for (var i = 0; i < Object.keys(urlParts.query).length; i++) {
    key = Object.keys(urlParts.query)[i];

    if (!["f", "limit", "offset", "bbox", "datetime"].includes(key)) {
      find_objects[key] = urlParts.query[key];
    }
  }

  if (urlParts.query.bbox != undefined) {
    var bbox = urlParts.query.bbox;

    if (!/((\d)+(\.)?(\d)*\,){3,}((\d)+(\.)?(\d)*){1}/.test(String(bbox)))
      return res.status(400).send({
        error: {
          code: "InvalidParameterValue",
          description: "Invalid bbox format",
        },
      });

    bbox = bbox.split(",");

    for (var i = 0; i < bbox.length; i++) {
      bbox[i] = Number(bbox[i]);
    }

    var min_x, max_x, min_y, max_y;

    if (bbox.length == 4) {
      if (bbox[0] >= bbox[2] || bbox[1] >= bbox[3])
        return res.status(400).send({
          error: {
            code: "InvalidParameterValue",
            description:
              "Invalid bbox format - min and max coordinates are not respected",
          },
        });
      if (bbox[0] > -180 && bbox[0] < 180) {
        min_x = bbox[0];
      } else {
        return res.status(400).send({
          error: {
            code: "InvalidParameterValue",
            description: "Invalid bbox format - min longitude problem",
          },
        });
      }
      if (bbox[1] > -90 && bbox[1] < 90) {
        min_y = bbox[1];
      } else {
        return res.status(400).send({
          error: {
            code: "InvalidParameterValue",
            description: "Invalid bbox format - min latitude problem",
          },
        });
      }
      if (bbox[2] > -180 && bbox[2] < 180) {
        max_x = bbox[2];
      } else {
        return res.status(400).send({
          error: {
            code: "InvalidParameterValue",
            description: "Invalid bbox format - max longitude problem",
          },
        });
      }
      if (bbox[3] > -90 && bbox[3] < 90) {
        max_y = bbox[3];
      } else {
        return res.status(400).send({
          error: {
            code: "InvalidParameterValue",
            description: "Invalid bbox format - max latitude problem",
          },
        });
      }
    } else {
      return res.status(500).send({
        error:
          "Error: Only 2dsphere index is currently supported by the database.",
      });
    }

    bbox = {
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

    var abstractCityObjects = await mongoose
      .model("CityObject")
      .find(find_objects, async (err, data) => {
        if (err) {
          return res
            .status(404)
            .send({ error: "Error: There is no item in this collection." });
        }
      })
      .where("location")
      .within(bbox)
      .limit(limit)
      .skip(offset)
      .lean();
  } else {
    var abstractCityObjects = await mongoose
      .model("CityObject")
      .find(find_objects, async (err, data) => {
        if (err) {
          return res
            .status(404)
            .send({ error: "Error: There is no item in this collection." });
        }
      })
      .limit(limit)
      .skip(offset)
      .lean();
  }

  if (
    Object.keys(abstractCityObjects).length == 0 ||
    abstractCityObjects == null ||
    abstractCityObjects == undefined
  ) {
    res.status(404).send({
      error:
        "Error: there is no items in this collection under these conditions.",
    });
    return;
  }

  for (var object in abstractCityObjects) {
    var geometries = [];

    for (var geom in abstractCityObjects[object].geometry) {
      geometries.push(
        await mongoose // Get geometries for the CityObject
          .model("Geometry")
          .findOne(
            { _id: abstractCityObjects[object].geometry[geom] },
            async (err, res_geom) => {
              if (err) return res.status(500).send(err);

              return res_geom;
            }
          )
          .lean()
      );
    }

    var max_lod = 0;
    var max_id = -1;

    for (var geom in geometries) {
      // Extract the highest LoD only
      if (geometries[geom].lod > Number(max_lod)) {
        max_lod = Number(geometries[geom].lod);
        max_id = geom;
      }
    }

    abstractCityObjects[object].geometry = [geometries[max_id]];
  }

  for (var object in abstractCityObjects) {
    var vertices = abstractCityObjects[object].vertices;
    var transform = abstractCityObjects[object].transform;

    delete abstractCityObjects[object].transform;

    for (var vertex in vertices) {
      (vertices[vertex][0] =
        vertices[vertex][0] * transform.scale[0] + transform.translate[0]),
        (vertices[vertex][1] =
          vertices[vertex][1] * transform.scale[1] + transform.translate[1]),
        (vertices[vertex][2] =
          vertices[vertex][2] * transform.scale[2] + transform.translate[2]);
    }
  }

  var self = "",
    alternate = ""; // Care of encoding

  if (urlParts.search != undefined) {
    self = urlParts.search.replace("?", "");
    alternate = urlParts.search.replace("?", "");
  }

  if (null == urlParts.query.f) {
    self = self + "&f=html";
    alternate = alternate + "&f=json";

    res.send(
      negoc.items(
        "html",
        self,
        alternate,
        req.params.collectionId,
        abstractCityObjects
      )
    );
  } else if ("json" == urlParts.query.f) {
    alternate = alternate.replace("f=json", "f=html");

    res.json(
      negoc.items(
        "json",
        self,
        alternate,
        req.params.collectionId,
        abstractCityObjects
      )
    );
  } else if ("html" == urlParts.query.f) {
    alternate = alternate.replace("f=html", "f=json");

    res.send(
      negoc.items(
        "html",
        self,
        alternate,
        req.params.collectionId,
        abstractCityObjects
      )
    );
  } else {
    res.status(400).json({
      error: { code: "InvalidParameterValue", description: "Invalid format" },
    });
  }
});

/**
 * @swagger
 * /collections/:collectionId/items/:item:
 *     get:
 *       summary: Get a specific CityJSONFeature.
 *       description: This function allows getting a specific CityJSONFeature. It gathers all information related to the object in the different collections from the database.
 *       tags: [Features]
 *       parameters:
 *         - in: query
 *           name: f
 *           schema:
 *             type: string
 *             enum: [HTML, json]
 *             default: HTML
 *         - in: path
 *           name: collectionId
 *           schema:
 *             type: string
 *         - in: path
 *           name: item
 *           schema:
 *             type: string
 *       responses:
 *         200:
 *           description: OK - returns a CityJSONFeature.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/CityJSONFeature'
 *         404:
 *           description: This item does not exist in this collection.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error:
 *                     type: string
 *                     example: This item does not exist in this collection.
 *         400:
 *           description: Returns an error due to format.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                         example: "InvalidParameterValue"
 *                       description:
 *                         type: string
 *                         example: "Invalid format"
 */
router.get(
  "/collections/:collectionId/items/:item",
  midWareCaching,
  async function (req, res) {
    var urlParts = url.parse(req.url, true);

    var abstractCityObject = await mongoose
      .model("CityObject")
      .findOne({ name: req.params.item }, async (err, data) => {
        if (err) {
          return res.status(404).send({ error: "Error: " + err });
        }
      })
      .lean();

    if (abstractCityObject == null) {
      return res.status(404).send({
        error: "This item does not exist in this collection.",
      });
    }

    var authorised_type = [
      "Building",
      "Bridge",
      "CityObjectGroup",
      "CityFurniture",
      "GenericCityObject",
      "LandUse",
      "PlantCover",
      "Railway",
      "Road",
      "SolitaryVegetationObject",
      "TINRelief",
      "TransportSquare",
      "Tunnel",
      "WaterBody",
    ];

    if (!authorised_type.includes(abstractCityObject.type)) {
      res.status(400).json({
        error:
          "This object is not a 1st-level city objects and thus is not queriable.",
      });
      return;
    }

    var geometries = [];

    for (var geom in abstractCityObject.geometry) {
      geometries.push(
        await mongoose // Get geometries for the CityObject
          .model("Geometry")
          .findOne(
            { _id: abstractCityObject.geometry[geom] },
            async (err, res_geom) => {
              if (err) return res.status(500).send(err);

              return res_geom;
            }
          )
          .lean()
      );
    }

    var max_lod = 0;
    var max_id = -1;

    for (var geom in geometries) {
      // Extract the highest LoD only
      if (geometries[geom].lod > Number(max_lod)) {
        max_lod = Number(geometries[geom].lod);
        max_id = geom;
      }
    }

    abstractCityObject.geometry = [geometries[max_id]];

    var vertices = abstractCityObject.vertices;
    var transform = abstractCityObject.transform;

    delete abstractCityObject.transform;

    for (var vertex in vertices) {
      (vertices[vertex][0] =
        vertices[vertex][0] * transform.scale[0] + transform.translate[0]),
        (vertices[vertex][1] =
          vertices[vertex][1] * transform.scale[1] + transform.translate[1]),
        (vertices[vertex][2] =
          vertices[vertex][2] * transform.scale[2] + transform.translate[2]);
    }

    // Creating the CityJSONFeature

    var cityJSONFeature = {};

    cityJSONFeature.type = "CityJSONFeature";
    cityJSONFeature.id = abstractCityObject.name;

    cityJSONFeature.CityObjects = {};

    cityJSONFeature.vertices = abstractCityObject.vertices;
    cityJSONFeature.appearance = abstractCityObject.appearance;

    delete abstractCityObject.vertices;
    delete abstractCityObject.appearance;

    cityJSONFeature.CityObjects[abstractCityObject.name] = abstractCityObject;

    if (abstractCityObject.children != undefined) {
      for (var child in abstractCityObject.children) {
        var child_object = await mongoose // Get geometries for the CityObject
          .model("CityObject")
          .findOne(
            { name: abstractCityObject.children[child] },
            async (err, res_geom) => {
              if (err) return res.status(500).send(err);

              return res_geom;
            }
          )
          .lean();

        var geometries = [];

        for (var geom in child_object.geometry) {
          geometries.push(
            await mongoose // Get geometries for the CityObject
              .model("Geometry")
              .findOne(
                { _id: child_object.geometry[geom] },
                async (err, res_geom) => {
                  if (err) return res.status(500).send(err);

                  return res_geom;
                }
              )
              .lean()
          );
        }

        var max_lod = 0;
        var max_id = -1;

        for (var geom in geometries) {
          // Extract the highest LoD only
          if (geometries[geom].lod > Number(max_lod)) {
            max_lod = Number(geometries[geom].lod);
            max_id = geom;
          }
        }

        var child_vertices = child_object.vertices;
        transform = child_object.transform;

        delete child_object.transform;

        for (var vertex in child_vertices) {
          (child_vertices[vertex][0] =
            child_vertices[vertex][0] * transform.scale[0] +
            transform.translate[0]),
            (child_vertices[vertex][1] =
              child_vertices[vertex][1] * transform.scale[1] +
              transform.translate[1]),
            (child_vertices[vertex][2] =
              child_vertices[vertex][2] * transform.scale[2] +
              transform.translate[2]);
        }

        var vertices_length = cityJSONFeature.vertices.length;

        var new_boundaries = await switchGeometries(
          geometries[max_id].boundaries,
          vertices_length
        );

        child_object.geometry = [new_boundaries];

        cityJSONFeature.vertices.concat(child_vertices);
        // Appearrances ?! Dont have so cant try.

        delete child_object.vertices;

        cityJSONFeature.CityObjects[child_object.name] = child_object;
      }
    }

    // might be unused but still guarantes it
    delete cityJSONFeature.transform;
    delete cityJSONFeature.version;
    delete cityJSONFeature.metadata;
    delete cityJSONFeature["geometry-templates"];
    delete cityJSONFeature.extensions;

    if (null == urlParts.query.f)
      res.send(
        await negoc.item(
          "html",
          req.params.collectionId,
          abstractCityObject.name,
          cityJSONFeature
        )
      );
    else if ("json" == urlParts.query.f)
      res.json(
        await negoc.item(
          "json",
          req.params.collectionId,
          abstractCityObject.name,
          cityJSONFeature
        )
      );
    else if ("html" == urlParts.query.f)
      res.send(
        await negoc.item(
          "html",
          req.params.collectionId,
          abstractCityObject.name,
          cityJSONFeature
        )
      );
    else
      res.status(400).json({
        error: { code: "InvalidParameterValue", description: "Invalid format" },
      });
  }
);

module.exports = router;

async function switchGeometries(array, index) {
  for (var el in array) {
    if (array[el].constructor === Array) {
      array[el] = await switchGeometries(array[el], index);
    } else {
      array[el] = array[el] + index;
    }
  }

  return array;
}
