var express = require("express");
var router = express.Router();
const mongoose = require("mongoose");
var url = require("url");
var fs = require("fs");
var negoc = require("./contentNegotiation");

/**
 * @swagger
 * /:
 *     get:
 *       summary: Get a specific CityModel.
 *       description: This function allows getting a specific CityModel. It gathers all information related to the model in the different collections from the database.
 *       tags: [Features]
 *       parameters:
 *       - name: name
 *         description: Name of the CityModel - name of the file in the Measur3D application.
 *         in: body
 *         required: true
 *         type: string
 *       responses:
 *         200:
 *           description: OK - returns a '#/CityModel'.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/CityModel'
 *         500:
 *           description: Not found - There is no CityModel in the database.
 */
router.get("/", function(req, res) {
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
      res.json(
        400,
        {error: {code: 'InvalidParameterValue', description: 'Invalid format'}}
      );
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
 *       summary: Get a specific CityModel.
 *       description: This function allows getting a specific CityModel. It gathers all information related to the model in the different collections from the database.
 *       tags: [Features]
 *       parameters:
 *       - name: name
 *         description: Name of the CityModel - name of the file in the Measur3D application.
 *         in: body
 *         required: true
 *         type: string
 *       responses:
 *         200:
 *           description: OK - returns a '#/CityModel'.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/CityModel'
 *         500:
 *           description: Not found - There is no CityModel in the database.
 */
router.get("/conformance", function(req, res) {
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

  res.json(200, conformance);
});

/**
 * @swagger
 * /api:
 *     get:
 *       summary: Get a specific CityModel.
 *       description: This function allows getting a specific CityModel. It gathers all information related to the model in the different collections from the database.
 *       tags: [Features]
 *       parameters:
 *       - name: name
 *         description: Name of the CityModel - name of the file in the Measur3D application.
 *         in: body
 *         required: true
 *         type: string
 *       responses:
 *         200:
 *           description: OK - returns a '#/CityModel'.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/CityModel'
 *         500:
 *           description: Not found - There is no CityModel in the database.
 */
router.get("/api", function(req, res) {
  res.json("{api def here in json}");
});

/**
 * @swagger
 * /api.html:
 *     get:
 *       summary: Get a specific CityModel.
 *       description: This function allows getting a specific CityModel. It gathers all information related to the model in the different collections from the database.
 *       tags: [Features]
 *       parameters:
 *       - name: name
 *         description: Name of the CityModel - name of the file in the Measur3D application.
 *         in: body
 *         required: true
 *         type: string
 *       responses:
 *         200:
 *           description: OK - returns a '#/CityModel'.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/CityModel'
 *         500:
 *           description: Not found - There is no CityModel in the database.
 */
router.get("/api.html", function(req, res) {
  res.send("api description in html");
});

/**
 * @swagger
 * /collections:
 *     get:
 *       summary: Get a specific CityModel.
 *       description: This function allows getting a specific CityModel. It gathers all information related to the model in the different collections from the database.
 *       tags: [Features]
 *       parameters:
 *       - name: name
 *         description: Name of the CityModel - name of the file in the Measur3D application.
 *         in: body
 *         required: true
 *         type: string
 *       responses:
 *         200:
 *           description: OK - returns a '#/CityModel'.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/CityModel'
 *         500:
 *           description: Not found - There is no CityModel in the database.
 */
router.get("/collections", function(req, res) {
  var urlParts = url.parse(req.url, true);

  const collections = Object.keys(mongoose.connection.collections);

  if (null == urlParts.query.f) {
    res.send(negoc.collections("html", collections));
  } else if ("json" == urlParts.query.f) {
    res.json(negoc.collections("json", collections));
  } else if ("html" == urlParts.query.f)
    res.send(negoc.collections("html", collections));
  else res.json(400, { error: "InvalidParameterValue" });
});

/**
 * @swagger
 * /collections/:collectionId:
 *     get:
 *       summary: Get a specific CityModel.
 *       description: This function allows getting a specific CityModel. It gathers all information related to the model in the different collections from the database.
 *       tags: [Features]
 *       parameters:
 *       - name: name
 *         description: Name of the CityModel - name of the file in the Measur3D application.
 *         in: body
 *         required: true
 *         type: string
 *       responses:
 *         200:
 *           description: OK - returns a '#/CityModel'.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/CityModel'
 *         500:
 *           description: Not found - There is no CityModel in the database.
 */
router.get("/collections/:collectionId", function(req, res) {
  var model = "";

  switch (req.params.collectionId) {
    case "materials":
      model = "Material";
      break;
    case "textures":
      model = "Texture";
      break;
    case "geometryinstances":
      model = "GeometryInstance";
      break;
    case "geometries":
      model = "Geometry";
      break;
    case "cityobjects":
      model = "CityObject";
      break;
    case "citymodels":
      model = "CityModel";
      break;
  }

  const collections = Object.keys(mongoose.connection.collections);

  if (!collections.includes(req.params.collectionId)) {
    res
      .status(404)
      .send({error: "The requested URL " + req.url + " was not found on this server"});
    return;
  }

  var urlParts = url.parse(req.url, true);

  if (null == urlParts.query.f)
    res.send(negoc.collection("html", req.params.collectionId));
  else if ("json" == urlParts.query.f)
    res.json(negoc.collection("json", req.params.collectionId));
  else if ("html" == urlParts.query.f)
    res.send(negoc.collection("html", req.params.collectionId));
  else
    res.json(
      400,
      {error: {code: 'InvalidParameterValue', description: 'Invalid format'}}
    );
});

/**
 * @swagger
 * /collections/:collectionId/items:
 *     get:
 *       summary: Get a specific CityModel.
 *       description: This function allows getting a specific CityModel. It gathers all information related to the model in the different collections from the database.
 *       tags: [Features]
 *       parameters:
 *       - name: name
 *         description: Name of the CityModel - name of the file in the Measur3D application.
 *         in: body
 *         required: true
 *         type: string
 *       responses:
 *         200:
 *           description: OK - returns a '#/CityModel'.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/CityModel'
 *         500:
 *           description: Not found - There is no CityModel in the database.
 */
router.get("/collections/:collectionId/items", async function(req, res) {
  var model = "";

  switch (req.params.collectionId) {
    case "materials":
      model = "Material";
      break;
    case "textures":
      model = "Texture";
      break;
    case "geometryinstances":
      model = "GeometryInstance";
      break;
    case "geometries":
      model = "Geometry";
      break;
    case "cityobjects":
      model = "CityObject";
      break;
    case "citymodels":
      model = "CityModel";
      break;
  }

  var items = await mongoose
    .model(model)
    .find({}, async (err, data) => {
      if (err) res.status(500).send({error: err})
    })
    .lean();

  if (items == null)
  {
    res.status(404).send("The requested URL " + req.url + " was not found on this server");
    return;
  }

  var urlParts = url.parse(req.url, true);
  if (null == urlParts.query.f)
    res.send(negoc.items("html", req.params.collectionId, items));
  else if ("json" == urlParts.query.f)
    res.json(negoc.items("json", req.params.collectionId, items));
  else if ("html" == urlParts.query.f)
    res.send(negoc.items("html", req.params.collectionId, items));
  else
    res.json(400, {error: {code: 'InvalidParameterValue', description: 'Invalid format'}})
});

/**
 * @swagger
 * /collections/:collectionId/items/:item:
 *     get:
 *       summary: Get a specific CityModel.
 *       description: This function allows getting a specific CityModel. It gathers all information related to the model in the different collections from the database.
 *       tags: [Features]
 *       parameters:
 *       - name: name
 *         description: Name of the CityModel - name of the file in the Measur3D application.
 *         in: body
 *         required: true
 *         type: string
 *       responses:
 *         200:
 *           description: OK - returns a '#/CityModel'.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/CityModel'
 *         500:
 *           description: Not found - There is no CityModel in the database.
 */
router.get("/collections/:collectionId/items/:item", function(req, res) {
  console.log(req.params);
  res.send("collections/:collectionId/items/:item");
});

module.exports = router;
