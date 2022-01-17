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
  const query = {};
  if (req.query.action) query["action"] = req.query.action;

  const d = await Transaction.find(query).sort({ createdAt: -1 }).limit(50);
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
  const _oldProduct = await Product.findByIdAndUpdate(req.body._id, newJson, {
    new: false,
  });
  const oldProduct = {};
  for (const property in _oldProduct) {
    if (_oldProduct[property] !== "")
      oldProduct[property] = _oldProduct[property];
  }

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
  const filtered = {};
  for (const property in req.body) {
    if (req.body[property] !== "") filtered[property] = req.body[property];
  }

  const result = await new Product(filtered).save();
  var TransactionObj = {
    action: "add",
    comment: req.body.comment,
    pid: result._id,
    new_snapshot: new Product(result),
    author: req.body.author,
  };
  if (result) await new Transaction(TransactionObj).save();
  res.redirect("https://rk-fe.pages.dev/add");
});

app.post("/reverseTransaction", async function (req, res) {
  const trans_id = req.body.trans_id;
  const transaction = await Transaction.findOne({ _id: trans_id });
  const old_snapshot = transaction.old_snapshot;
  const _new_snapshot = transaction.new_snapshot;
  const action = transaction.action;

  const newId = _new_snapshot._id;
  const _latest_snapshot = await Product.findOne({ _id: newId });
  const latest_snapshot = {};
  const new_snapshot = {};
  for (const property in _latest_snapshot) {
    if (_latest_snapshot[property] !== "")
      latest_snapshot[property] = _latest_snapshot[property];
  }

  for (const property in _new_snapshot) {
    if (_new_snapshot[property] !== "")
      new_snapshot[property] = _new_snapshot[property];
  }

  //compare latest_snap and new_snap for equal
  if (
    JSON.stringify(new Product(latest_snapshot)) ===
    JSON.stringify(new Product(new_snapshot))
  ) {
    //reverse the transaction
    console.log("Reversing");
    if (!old_snapshot) {
      await Product.deleteOne({ _id: newId });
    } else await Product.findOneAndReplace({ _id: newId }, old_snapshot);
    await Transaction.findByIdAndUpdate(
      { _id: trans_id },
      { isReversed: true }
    );
    res.json({ code: 200, message: "success" });
  } else {
    res.json({ code: 404, message: "cannot reverse" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server Ready! at http://localhost:" + PORT);
});
