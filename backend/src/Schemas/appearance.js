let mongoose = require("mongoose");

let MaterialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ambientIntensity: Number,
  diffuseColor: {
    type: [Number],
    default: undefined,
    validate: function() {
      return (this["diffuseColor"].length == 3 || this["emissiveColor"].length == 0);
    }
  },
  emissiveColor: {
    type: [Number],
    default: undefined,
    validate: function() {
      return (this["emissiveColor"].length == 3 || this["emissiveColor"].length == 0);
    }
  },
  specularColor: {
    type: [Number],
    default: undefined,
    validate: function() {
      return (this["specularColor"].length == 3 || his["specularColor"].length == 0);
    }
  },
  shininess: Number,
  transparency: Number,
  isSmooth: Boolean
});

let TextureSchema = new mongoose.Schema({
  type: { type: String, enum: ["PNG", "JPG"] },
  image: String,
  wrapMode: {
    type: String,
    enum: ["none", "wrap", "mirror", "clamp", "border"]
  },
  textureType: { type: String, enum: ["unknown", "specific", "typical"] },
  borderColor: {
    type: [Array],
    default: undefined,
    validate: function() {
      return (
        this["borderColor"].length == 3 || this["borderColor"].length == 4
      );
    }
  }
});

Material = mongoose.model("Material", MaterialSchema);
Texture= mongoose.model("Texture", TextureSchema);
