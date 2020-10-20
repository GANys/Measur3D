const express = require("express");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Features
 *   description: OGC API - Features service
 */

 /* - $ref: '#/parameters/username' */

 /**
  * @swagger
  * /users:
  *   post:
  *     description: Returns users
  *     tags: [Features]
  *     produces:
  *       - application/json
  *     parameters:
  *
  *     responses:
  *       200:
  *         description: users
  */
 router.post("/uploadCityModel", (req, res) => {
   req.setTimeout(10 * 60 * 1000); // Special timeOut

   Cities.insertCity(req.body).then(function(data) {
     return res.status(201).send(data);
   });
 });

module.exports = router;
