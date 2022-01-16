const PORT = process.env.PORT || 5002;

var express = require("express");
var app = express();
const mongoose = require("mongoose");
const Product = require("./models/Product");
const Transaction = require("./models/Transaction");
// set the view engine to ejs
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
const _ = require("lodash");
require("dotenv").config();
mongoose.connect(
  process.env.MONGO_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  () => {
    console.log("Connected to Mongo");
  }
);
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded());

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

var cors = require("cors");
app.use(cors());
// index page
// function fun() {
//   for (var i = 0; i < 100; i++)
//     new Product({
//       sl_no: 77,
//       category: "type 5",
//       id_no: 11,
//       supplier: "Modii",
//       r1_key: "color",
//       r1_value: "purple",
//       r2_key: "door",
//       r2_value: "3",
//       current_stock: 2,
//       dp: 90,
//       dp_extra: 4,
//       mrp: 8734,

//       pirticular: "kgzdfkudsbfksbfd",
//     }).save();
// }
// fun();
app.get("/", async function (req, res) {
  const { s, category } = req.query;

  const q = [];
  if (s !== "")
    q.push({
      $search: {
        index: "default",
        text: {
          query: s,
          path: {
            wildcard: "*",
          },
        },
      },
    });
  if (category !== "")
    q.push({
      $match: {
        category: category,
      },
    });
  if (category === "")
    q.push({
      $match: {},
    });
  q.push({ $limit: 100 });
  const d = await await Product.aggregate(q);
  res.json(d);
});
app.get("/transactions", async function (req, res) {
  console.log("trans hit");

  const d = await Transaction.find().sort({ createdAt: -1 }).limit(50);
  res.json(d);
});
app.get("/getCategory", async function (req, res) {
  const p = await Product.find({}).distinct("category");

  res.json(p);
});
app.get("/getCategoryParam", async function (req, res) {
  const p = await Product.findOne({ category: req.query.category });

  const json = {
    name: req.query.category,
    r1_key: p.r1_key,
    r2_key: p.r2_key,
    r3_key: p.r3_key,
    r4_key: p.r4_key,
    r5_key: p.r5_key,
  };

  res.json(json);
});
app.post("/modify", async function (req, res) {
  const newJson = {};
  for (const property in req.body) {
    if (req.body[property] !== "") newJson[property] = req.body[property];
  }
  //console.log("new json:", newJson);
  const _oldProduct = await Product.findByIdAndUpdate(req.body._id, newJson, {
    new: false,
  });
  const oldProduct = {};
  for (const property in _oldProduct) {
    if (_oldProduct[property] !== "")
      oldProduct[property] = _oldProduct[property];
  }

  console.log(req.body);
  var TransactionObj = {
    action: req.body.action,
    comment: req.body.comment,
    pid: req.body._id,
    old_snapshot: new Product(oldProduct),
    new_snapshot: new Product(newJson),
    author: req.body.author,
  };
  if (oldProduct) await new Transaction(TransactionObj).save();

  res.json("Success");
});
app.post("/add", async function (req, res) {
  console.log(req.body);
  const result = await new Product(req.body).save();
  var TransactionObj = {
    action: "add",
    comment: req.body.comment,
    pid: result._id,
    new_snapshot: new Product(result),
    author: req.body.author,
  };
  if (result) await new Transaction(TransactionObj).save();
  res.json("Success");
});

app.post("/reverseTransaction", async function (req, res) {
  // console.log(req.body);
  // const trans_id = req.body.trans_id;
  // const transaction = await Transaction.findOne({ _id: trans_id });
  // const old_snapshot = transaction.old_snapshot;
  // const new_snapshot = transaction.new_snapshot;
  // const action = transaction.action;
  // if (action === "sell") {
  //   const newId = new_snapshot._id;
  //   const _latest_snapshot = await Product.findOne({ _id: newId });
  //   const latest_snapshot = {};
  //   for (const property in _latest_snapshot) {
  //     if (_latest_snapshot[property] !== "")
  //       latest_snapshot[property] = _latest_snapshot[property];
  //   }
  //   console.log(latest_snapshot, new_snapshot);
  //   //compare latest_snap and new_snap for equal
  //   if (_.isEqual(latest_snapshot, new_snapshot)) {
  //     //reverse the transaction
  //     console.log("Reversing");
  //     await Product.findOneAndReplace({ _id: _id }, old_snapshot);
  //     await Transaction.findByIdAndUpdate(
  //       { _id: trans_id },
  //       { isReversed: true }
  //     );
  //     res.json("Success");
  //   } else {
  //     console.log("cannot rev");
  //     res.json("Cannot reverse");
  //   }
  // }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server Ready! at http://localhost:" + PORT);
});
