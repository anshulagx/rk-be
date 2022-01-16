var mongoose = require("mongoose");

var schema = mongoose.Schema({
  sl_no: {
    type: "String",
  },
  category: {
    type: "String",
  },
  id_no: {
    type: "String",
  },
  pirticular: {
    type: "String",
  },
  supplier: {
    type: "String",
  },
  r1_key: {
    type: "String",
  },
  r1_value: {
    type: "String",
  },
  r2_key: {
    type: "String",
  },
  r2_value: {
    type: "String",
  },
  r3_key: {
    type: "String",
  },
  r3_value: {
    type: "String",
  },
  r4_key: {
    type: "String",
  },
  r4_value: {
    type: "String",
  },
  r5_key: {
    type: "String",
  },
  r5_value: {
    type: "String",
  },
  current_stock: {
    type: "String",
    default: "0",
  },
  dp: {
    type: "String",
    default: "0",
  },
  dp_extra: {
    type: "String",
    default: "0",
  },
  mrp: {
    type: "String",
    default: "0",
  },
});
var Product = mongoose.model("Product", schema);

module.exports = Product;
