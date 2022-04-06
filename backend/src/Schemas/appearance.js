let mongoose = require("mongoose");

/**
 *  @swagger
 *   components:
 *     schemas:
 *       Material:
 *         type: object
 *         required:
 *           - name
 *         properties:
 *           name:
 *             type: string
 *             description: A string identifying the material.
 *           ambientIntensity:
 *             type: number
 *             description: Value is a number between 0.0 and 1.0.
 *           diffuseColor:
 *             type: array
 *             items:
 *               type: number
 *             description: Value is a number between 0.0 and 1.0 (RGB colour).
 *           emissiveColor:
 *             type: array
 *             items:
 *               type: number
 *             description: Value is a number between 0.0 and 1.0 (RGB colour).
 *           specularColor:
 *             type: array
 *             items:
 *               type: number
 *             description: Value is a number between 0.0 and 1.0 (RGB colour).
 *           shininess:
 *             type: number
 *             description: Value is a number between 0.0 and 1.0.
 *           transparency:
 *             type: number
 *             description: Value is a number between 0.0 and 1.0 (1.0 being completely transparent).
 *           isSmooth:
 *             type: boolean
 *             description: If this boolean flag is set to true, vertex normals should be used for shading (Gouraud shading). Otherwise, normals should be constant for a surface patch (flat shading).
 *         example:
 *           name: roofandground
 *           ambientIntensity:  0.48
 *           diffuseColor:  [0.8000, 0.2000, 0.7500]
 *           emissiveColor: [0.8000, 0.2000, 0.7500]
 *           specularColor: [0.8000, 0.2000, 0.7500]
 *           shininess: 0.5
 *           transparency: 0.5
 *           isSmooth: true
 */

let MaterialSchema = new mongoose.Schema({
  name: { type: String }, // Will be set to required after rework.
  CityModel: String,
  ambientIntensity: Number,
  diffuseColor: {
    type: [Number],
    default: undefined,
    validate: function () {
      return (
        this["diffuseColor"].length == 3 || this["emissiveColor"].length == 0
      );
    },
  },
  emissiveColor: {
    type: [Number],
    default: undefined,
    validate: function () {
      return (
        this["emissiveColor"].length == 3 || this["emissiveColor"].length == 0
      );
    },
  },
  specularColor: {
    type: [Number],
    default: undefined,
    validate: function () {
      return (
        this["specularColor"].length == 3 || his["specularColor"].length == 0
      );
    },
  },
  shininess: Number,
  transparency: Number,
  isSmooth: Boolean,
});

/**
 *  @swagger
 *   components:
 *     schemas:
 *       Texture:
 *         type: object
 *         required:
 *           - type
 *           - image
 *         properties:
 *           type:
 *             type: string
 *             description: A string with either "PNG" or "JPG" as value.
 *           image:
 *             type: string
 *             description: A string with the name of the file. This file can be a URL, a relative path or an absolute path.
 *           wrapMode:
 *             type: string
 *             enums: ["none", "wrap", "mirror", "clamp", "border"]
 *           textureType:
 *             type: string
 *             enums: ["unknown", "specific", "typical"]
 *           borderColor:
 *             type: array
 *             items:
 *               type: number
 *             description: Numbers between 0.0 and 1.0 (RGBA colour).
 *         example:
 *           type: PNG
 *           image: src/images/wall.png
 *           wrapMode: wrap
 *           textureType: unknown
 *           borderColor: [0.0, 0.0, 0.0, 1.0]
 */

let TextureSchema = new mongoose.Schema({
  uid: { type: String }, // Will be set to required after rework.
  type: { type: String, enum: ["PNG", "JPG"] },
  image: String,
  wrapMode: {
    type: String,
    enum: ["none", "wrap", "mirror", "clamp", "border"],
  },
  textureType: { type: String, enum: ["unknown", "specific", "typical"] },
  borderColor: {
    type: [Array],
    default: undefined,
    validate: function () {
      return this["borderColor"].length == 3 || this["borderColor"].length == 4;
    },
  },
});

Material = mongoose.model("Material", MaterialSchema);
Texture = mongoose.model("Texture", TextureSchema);
