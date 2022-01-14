var mongoose = require("mongoose");

var schema = mongoose.Schema(
  {
    action: {
      type: "String",
      enum: ["sell", "add", "modify"],
      default: "sell",
    },
    comment: {
      type: "String",
    },
    sold_at_price: {
      type: "Number",
      default: 0,
    },
    pid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    old_snapshot: {
      type: "Mixed",
    },
    new_snapshot: {
      type: "Mixed",
    },
    author: {
      type: "String",
      default: "None",
    },
  },
  {
    timestamps: true,
  }
);
var Transaction = mongoose.model("Transaction", schema);

module.exports = Transaction;
