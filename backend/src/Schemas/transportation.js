let mongoose = require("mongoose");

let Transportation = new mongoose.Schema({
  attributes: {
    type: Object,
    properties: {
      trafficDirection: {
        type: String,
        enum: ["one-way", "two-way"],
      },
    },
  },
});

module.exports = {
  Transportation: Transportation,
};
