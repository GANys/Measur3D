const express = require("express");

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

module.exports = router;
