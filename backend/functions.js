const mongoose = require("mongoose");

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function lengthInUtf8Bytes(str) {
  // Matches only the 10.. bytes that are non-initial characters in a multi-byte sequence.
  var m = encodeURIComponent(str).match(/%[89ABab]/g);
  return str.length + (m ? m.length : 0);
}

async function recursiveDelete(params) {
  // Find the object in order to handle its relations with other objects
  var cityObject = await mongoose
    .model("CityObject")
    .findOne({ name: params.name }, async (err, data_object) => {
      if (err)
        return res
          .status(500)
          .send({ error: "There is no object with that name." });
    })
    .lean();

  // Recursive deletion of all children of the deleted object
  if (cityObject.children != undefined && cityObject.children.length > 0) {
    for (var child in cityObject.children) {
      await recursiveDelete({
        name: cityObject.children[child],
        CityModel: params.CityModel
      });
    }
  }

  // Update the children value for all parents of the deleted element
  if (cityObject.parents != undefined && cityObject.parents.length > 0) {
    for (var parent in cityObject.parents) {
      var objectParentChildren = await mongoose
        .model("CityObject")
        .findOne(
          { name: cityObject.parents[parent] },
          "children",
          (err, objectParent) => {
            if (err)
              return res.status(500).send({
                error: "This object is isolated (no parent found)."
              });
          }
        )
        .lean();

      const index = objectParentChildren.children.indexOf(params.name);
      if (index > -1) {
        objectParentChildren.children.splice(index, 1);
      }

      await mongoose
        .model("CityObject")
        .updateOne(
          { name: cityObject.parents[parent] },
          { $set: { children: objectParentChildren.children } },
          (err, objectParentUpdated) => {
            if (err)
              return res.status(500).send({
                error: "This object is isolated (no parent found)."
              });
          }
        );
    }
  }

  // Delete reference within CityModel document
  var cityModelObjects = await mongoose
    .model("CityModel")
    .findOne(
      { name: params.CityModel },
      "CityObjects",
      (err, data_citymodel) => {
        if (err)
          return res.status(500).send({
            error: "This object is isolated (no related City Model)."
          });
      }
    )
    .lean();

  delete cityModelObjects.CityObjects[params.name];

  await mongoose
    .model("CityModel")
    .updateOne(
      { name: params.CityModel },
      { $set: { CityObjects: cityModelObjects.CityObjects } },
      (err, data_citymodel) => {
        if (err)
          return res.status(500).send({
            error: "This object is isolated (no related City Model)."
          });
      }
    );

  // Finally delete the initial objects
  await mongoose
    .model("CityObject")
    .deleteOne({ name: params.name }, async (err, data_object) => {
      if (err)
        return res
          .status(500)
          .send({ error: "There is no object with that name." });
    });

  await mongoose
    .model("Geometry")
    .deleteMany({ CityObject: params.name }, err => {
      if (err)
        return res
          .status(500)
          .send({ error: "There is no object with that name." });
    });
}

module.exports = { formatBytes, lengthInUtf8Bytes, recursiveDelete };
