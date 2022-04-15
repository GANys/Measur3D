const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const logger = require("morgan");
const path = require("path");

let Cities = require("../src/Schemas/citymodel.js");
let Functions = require("./util/functions");

const router = express.Router();

//-------------------------------------------------------------------------------------

/**
 * @swagger
 * /uploadCityModel:
 *     post:
 *       summary: Uploads a CityModel.
 *       description: This function allows to upload a CityJSON file (v 1.0.x). The file will be processed in order to distribute the information in the different documents in the database following the CityModel, AbstractCityObject and Geometry schemas (other schemas will be supported in further developments).
 *       tags: [Measur3D]
 *       parameters:
 *       - name: jsonName
 *         description: Name of the CityModel - name of the file in the Measur3D application.
 *         in: body
 *         required: true
 *         type: string
 *       - name: content
 *         description: The content of the JSON file as a JSON object.
 *         in: body
 *         required: true
 *         type: object
 *         schema:
 *           $ref: '#/components/schemas/CityModel'
 *       responses:
 *         201:
 *           description: Created - upload of the CityJSON file successful.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: string
 *                     default: "File uploaded"
 *               example: {success: "File uploaded"}
 *         408:
 *           description: Request timeout - took over 10 minutes (Uploading a CityModel can be very long).
 */
router.post("/uploadCityModel", (req, res) => {
  req.setTimeout(10 * 60 * 1000); // Special timeOut

  mongoose
    .model("CityModel")
    .countDocuments({ uid: req.body.cm_uid }, function (err, count) {
      if (err) {
        return res.status(400).json({ error: err });
      }
      if (count > 0) {
        return res.status(409).json({
          error:
            "/uploadCityModel : this model already exist. Consider updating it.",
        });
      }

      Cities.insertCity(req.body.cm_uid, req.body.json).then(function (data) {
        return res
          .status(201)
          .json({ success: "/uploadCityModel : model saved" });
      });
    });
});

/**
 * @swagger
 * /getCityModelsList:
 *     get:
 *       summary: Get list of available CityModels.
 *       description: Concurrent models can be stored in the database. This function allows describing these models providing summary information.
 *       tags: [Measur3D]
 *       responses:
 *         200:
 *           description: OK - returns.
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *               example: [{name: model_1}, {name: model_2}]
 *         404:
 *           description: Not found - There is no CityModel in the database.
 */
router.get("/getCityModelsList", (req, res) => {
  mongoose
    .model("CityModel")
    .find({}, "uid", async (err, data) => {
      if (err) {
        return res.status(404).send({
          error: "/getCityModelsList : there is no CityModel in the database.",
        });
      }

      var responseCities = [];

      for (var i = 0; i < data.length; ++i) {
        responseCities.push({
          cm_uid: data[i].uid, // Possible to add more information
        });
      }

      return res.status(200).json(responseCities);
    })
    .lean();
});

/**
 * @swagger
 * /getCityModel:
 *     get:
 *       summary: Get a specific CityModel.
 *       description: This function allows getting a specific CityModel. It gathers all information related to the model in the different collections from the database.
 *       tags: [Measur3D]
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
router.get("/getCityModel", async (req, res) => {
  try {
    var citymodel = await mongoose
      .model("CityModel")
      .findOne({ uid: req.query.cm_uid })
      .populate({
        path: "CityObjects",
        populate: {
          path: "geometry",
        },
      })
      .lean();
  } catch (err) {
    return res.status(404).send({
      error:
        "/getCityModel : there is no CityModel with this name in the database.",
    });
  }

  /*

  for (var cityobject in cityModel.CityObjects) {
    var cityObjectType = cityModel.CityObjects[cityobject].type;

    switch (cityObjectType) {
      case "BuildingPart":
        cityObjectType = "Building";
        break;
      case "Road":
      case "Railway":
      case "TransportSquare":
        cityObjectType = "Transportation";
        break;
      case "TunnelPart":
        cityObjectType = "Tunnel";
        break;
      case "BridgePart":
        cityObjectType = "Bridge";
        break;
      case "BridgeConstructionElement":
        cityObjectType = "BridgeInstallation";
        break;
      default:
    }

    try {
      cityModel.CityObjects[cityobject] = await mongoose // Get the document of the CityObjects
        .model(cityObjectType)
        .findOne({ name: cityobject })
        .lean();
    } catch (err) {
      return res.status(500).send(err);
    }

    //console.log(cityModel.CityObjects[cityobject]._id + " " + cityobject)
    //console.log("-----------------------------------------------------------------------------------------");

    var geometries = [];
    var geometry;

    for (var geom in cityModel.CityObjects[cityobject].geometry) {
      try {
        geometry = await mongoose // Get geometries for the CityObject
          .model("Geometry")
          .findOne({ _id: cityModel.CityObjects[cityobject].geometry[geom] })
          .lean();
      } catch (err) {
        return res.status(500).send(err);
      }

      geometries.push(geometry);
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

    cityModel.CityObjects[cityobject].geometry = [geometries[max_id]];
  }

  */

  return res.status(200).json(citymodel);
});

/**
 * @swagger
 * /deleteCityModel:
 *     delete:
 *       summary: Delete a specific CityModel.
 *       description: This function allows deleting a specific CityModel. It deletes all information related to the model in the different collections from the database.
 *       tags: [Measur3D]
 *       responses:
 *         200:
 *           description: OK - returns a JSON success.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: string
 *                     default: City model deleted with success !
 *               example: {success: "City model deleted with success !"}
 *         404:
 *           description: Not found - There is no document with that name.
 */
router.delete("/deleteCityModel", (req, res) => {
  mongoose
    .model("CityModel")
    .findOneAndDelete(
      { uid: req.body.cm_uid },
      { projection: { CityObjects: 1 } }
    )
    .lean()
    .catch((err) => {
      if (err)
        return res.status(500).send({
          error: "/deleteCityModel : there is no citymodel with that uid.",
        });
    })
    .then((citymodel) => {
      var deletionObjects = [];
      for (var obj in citymodel.CityObjects) {
        deletionObjects.push(
          Functions.smartDeleteObject({
            _id: citymodel.CityObjects[obj],
            smart: false,
          })
        );
      }

      Promise.all(deletionObjects).then((data) => {
        return res.status(200).send({
          success: "/deleteCityModel : model and objects deleted.",
        });
      });
    });
});

/**
 * @swagger
 * /getObject:
 *     get:
 *       summary: Get a specific CityObject.
 *       description: This function allows getting a specific CityObject. It gathers the object and its highest lod geometry.
 *       tags: [Measur3D]
 *       parameters:
 *       - name: name
 *         description: Name of the object.
 *         in: body
 *         type: string
 *       - name: id
 *         description: Id of the object.
 *         in: body
 *         type: string
 *       - name: CityObjectType
 *         description: Type of the object.
 *         in: body
 *         required: true
 *         type: string
 *       responses:
 *         200:
 *           description: OK - returns a '#/AbstractCityObject'.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AbstractCityObject'
 *         400:
 *           description: Bad request - Params are not valid.
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               default: "Params are not valid."
 *         500:
 *           description: Internal error - getObject could not find Object in Collection. Error is sent by database.
 */
router.get("/getObject", (req, res) => {
  if (typeof req.query.uid != "undefined") {
    mongoose
      .model(Functions.mapType(req.query.CityObjectType))
      .findOne({ uid: req.query.uid }, (err, data) => {
        if (err) return res.status(500).send(err);
        return res.json(data);
      })
      .lean();
  } else {
    return res.status(400).send({
      error: "/getObject : No object exists under these conditions.",
    });
  }
});

/**
 * @swagger
 * /deleteObject:
 *     delete:
 *       summary: Delete a specific CityObject.
 *       description: This function allows deleting a specific CityObject. It deletes an object and all its related geometries.
 *       tags: [Measur3D]
 *       responses:
 *         200:
 *           description: OK - returns a JSON success.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: string
 *                     default: City model deleted with success !
 *               example: {success: "Object and children deleted !"}
 *         500:
 *           description: Something went bad - error generated by the database.
 */
router.delete("/deleteObject", (req, res) => {
  // Need of a recursive delete because of children
  Functions.smartDeleteObject({
    uid: req.body.uid,
    smart: true,
  }).then(function (data) {
    if (data.error != undefined) return res.status(404).json(data);
    return res.status(200).json(data);
  });
});

/**
 * @swagger
 * /getObjectAttributes:
 *     get:
 *       summary: Get the attributes of a specific CityObject.
 *       description: This function allows getting the attributes of a specific CityObject. It gathers the object attributes in order to render in the AttributesManager Component.
 *       tags: [Measur3D]
 *       parameters:
 *       - name: name
 *         description: Name of the object.
 *         in: body
 *         type: string
 *       - name: id
 *         description: Id of the object.
 *         in: body
 *         type: string
 *       - name: CityObjectType
 *         description: Type of the object.
 *         in: body
 *         required: true
 *         type: string
 *       responses:
 *         200:
 *           description: OK - returns an array of all the '#/AbstractCityObject.attributes'.
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   type: object
 *               example: Key/Value pairs
 *         400:
 *           description: Bad request - Params are not valid.
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               default: "Params are not valid."
 *         500:
 *           description: Internal error - getObjectAttributes could not find Object in Collection. Error is sent by database.
 */
router.get("/getObjectAttributes", (req, res) => {
  if (typeof req.query.uid != "undefined") {
    mongoose
      .model(Functions.mapType(req.query.CityObjectType))
      .findOne({ uid: req.query.uid }, "attributes", (err, data) => {
        if (err) return res.status(500).send({ error: err });
        return res.status(200).json(data);
      })
      .lean();
  } else {
    return res.status(404).send({
      error: "Params are not valid (getObjectAttributes).",
    });
  }
});

/**
 * @swagger
 * /updateObjectAttribute:
 *     put:
 *       summary: Update/delete an attribute of a specific CityObject.
 *       description: This function allows updating or deleting a key/value pair in the attributes of a specific CityObject. It corresponds to a modification of a line in the AttributesManager Component. If a new key or value is given, the pair is updated. If a value is not given, the old key is deleted from the document. If a new key is given, the key/value pair is created within the document.
 *       tags: [Measur3D]
 *       parameters:
 *       - name: jsonName
 *         description: Name of the object.
 *         in: body
 *         type: string
 *       - name: CityObjectType
 *         description: Type of the object.
 *         in: body
 *         required: true
 *         type: string
 *       - name: key
 *         description: The new key.
 *         in: body
 *         required: true
 *         type: string
 *       - name: old_key
 *         description: The old key.
 *         in: body
 *         type: string
 *       - name: value
 *         description: The value (can be empty).
 *         in: body
 *         required: true
 *         type: string
 *       responses:
 *         200:
 *           description: OK - returns a success message in a JSON object.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: string
 *                     default: "Object updated."
 *               example: Key/Value pairs
 *         400:
 *           description: Bad request - Params are not valid.
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               default: "Params are not valid."
 *         500:
 *           description: Internal error - updateObjectAttribute could not find Object in Collection. Error is sent by database.
 */
router.put("/updateObjectAttribute", async (req, res) => {
  mongoose
    .model(Functions.mapType(req.body.CityObjectType))
    .findOne({ uid: req.body.uid }, (err, data) => {
      if (err)
        return res.status(400).send({
          error: "/updateObjectAttribute : No object exists under this uid.",
        });

      //var attributes = data.attributes;
      var attributes = Object.assign({}, data.attributes); // Copy the CityObject attributes from Schema -> Undefined value if key is empty.

      for (var key in attributes) {
        // Clear the undefined key
        if (attributes[key] == undefined) {
          delete attributes[key];
        }
      }

      if (attributes == null) {
        // If attributes empty, create it
        attributes = {};
      }

      if (req.body.value == "") {
        // delete
        delete attributes[req.body.key];
      } else if (req.body.old_key) {
        //update
        delete attributes[req.body.old_key];
        attributes[req.body.key] = req.body.value;
      } else {
        // add
        attributes[req.body.key] = req.body.value;
      }

      mongoose
        .model(Functions.mapType(req.body.CityObjectType))
        .updateOne({ uid: req.body.uid }, { attributes }, (err, data) => {
          // Be carefull that object might change has it is not loaded by updateOne
          if (err) return res.status(500).send({ error: err });

          return res
            .status(200)
            .send({ success: "/updateObjectAttribute : Object updated." });
        });
    })
    .lean();
});

module.exports = router;
