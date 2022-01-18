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
const ExcelJS = require("exceljs");

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

app.get("/generateXls", async function (req, res) {
  const cat = await Product.find({}).distinct("category");

  const workbook = new ExcelJS.Workbook();

  await Promise.all(
    cat.map(async (c) => {
      const worksheet = workbook.addWorksheet(c);
      // console.log(c);
      const data = await Product.find({ category: c });
      // console.log(data.category);
      worksheet.columns = [
        {
          header: "System Number",
          key: "sl_no",
          width: 15,
        },
        {
          header: "Category",
          key: "category",
          width: 15,
        },
        { header: "ID", key: "id_no", width: 10 },
        { header: "Pirticular", key: "pirticular", width: 20 },

        { header: "Supplier", key: "supplier", width: 20 },

        { header: "Quantity", key: "current_stock", width: 10 },
        { header: "DP", key: "dp", width: 10 },
        { header: "Extra charge", key: "dp_extra", width: 10 },
        { header: "MRP", key: "mrp", width: 10 },
        data[0].r1_key
          ? { header: data[0].r1_key, key: "r1_value", width: 10 }
          : "",
        data[0].r1_key
          ? { header: data[0].r2_key, key: "r2_value", width: 10 }
          : "",
        data[0].r1_key
          ? { header: data[0].r3_key, key: "r3_value", width: 10 }
          : "",
        data[0].r1_key
          ? { header: data[0].r4_key, key: "r4_value", width: 10 }
          : "",
        data[0].r1_key
          ? { header: data[0].r5_key, key: "r5_value", width: 10 }
          : "",
      ];
      // console.log(data);
      data.map((e) => {
        worksheet.addRow(e);
      });
      worksheet.getRow(1).font = {
        bold: true,
      };

      // worksheet.getColumn("mrp").fill = {
      //   type: "pattern",
      //   pattern: "solid",
      //   fgColor: { argb: "8fb5f2" },
      // };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "F08080" },
      };
      return;
    })
  );

  var fileName = "stk.xlsx";

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=" + fileName);

  await workbook.xlsx.write(res);

  res.end();
  //  res.json(p);
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
