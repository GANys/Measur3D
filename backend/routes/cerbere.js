const express = require("express");
const mongoose = require("mongoose");

let CityObject = require("../src/Schemas_alternate/abstractcityobject_alternate.js");
let Building = require("../src/Schemas_alternate/building_alternate.js");

const router = express.Router();

//-------------------------------------------------------------------------------------

/**
 * @swagger
 * /:
 *     get:
 *       summary: Provide an example of a Cerbere route.
 *       description: This function illustrates the easiness to developpe new routes for Measur3D.
 *       tags: [Cerbere]
 *       responses:
 *         200:
 *           description: A description on the route capabilities.
 *           content:
 *             application/json:
  *               schema:
 *                 type: object
 *                 properties:
 *                   cerbere:
 *                     type: string
 *                     example: "Basics to create a new Head for CERBERE"
 */
 router.get("/", async (req, res) => {
   return res.status(200).json({
     cerbere:
       "Basics to create a new Head for CERBERE",
   });
 });

 router.get("/getBuilding_alternate", async (req, res) => {
   mongoose
     .model("CityObject_alternate")
     .find({}, function (err, data) {
       if (!data) {
         return res.status(404).json({
           error:
             "/cerbere/Building : there is no building in the DB.",
         });
       }
       return res.status(200).json(data);
     })
     .limit(1)
     .lean();
 });

module.exports = router;
