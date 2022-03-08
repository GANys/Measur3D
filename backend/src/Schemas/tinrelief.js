let mongoose = require("mongoose");

let TINRelief = new mongoose.Schema({
  geographicalExtent: { type: [Number], default: undefined },
});

module.exports = {
  TINRelief: TINRelief,
};
