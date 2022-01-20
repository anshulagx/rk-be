var mongoose = require("mongoose");

var schema = mongoose.Schema({
  uri: {
    type: "String",
  },
});
var Image = mongoose.model("Image", schema);

module.exports = Image;
