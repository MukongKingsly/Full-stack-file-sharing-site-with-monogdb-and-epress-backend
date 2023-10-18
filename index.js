require("dotenv").config();
const multer = require("multer");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
// const cors = require("cors");
const File = require("./models/fileModel");
const corsOptions = require("./config/corsOptions");

const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: true }));
// app.use(cors(corsOptions));
// Static files
app.use(express.static("public"));
app.use("/css", express.static(__dirname + "public/css"));
app.use("/img", express.static(__dirname + "public/img"));

const upload = multer({ dest: "uploads" });

mongoose.connect(process.env.DATABASE_URL);

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    const fileData = {
      path: req.file.path,
      originalName: req.file.originalname,
    };
    if (req.body.password != null && req.body.password !== "") {
      fileData.password = await bcrypt.hash(req.body.password, 10);
    }

    const file = await File.create(fileData);

    return res.render("index", {
      fileLink: `${req.headers.origin}/file/${file.id}`,
    });
  } catch (error) {
    next(error);
  }
});

app.route("/file/:id").get(handleDownload).post(handleDownload);

async function handleDownload(req, res, next) {
  try {
    const file = await File.findById(req.params.id);

    if (file.password != null) {
      if (req.body.password == null) {
        return res.render("password");
      }

      if (!(await bcrypt.compare(req.body.password, file.password))) {
        return res.render("password", { error: true });
      }
    }

    file.downloadCount++;
    await file.save();
    return res.download(file.path, file.originalName);
  } catch (error) {
    next(error);
  }
}

app.listen(process.env.PORT, () =>
  console.info(`Listening on port ${process.env.PORT}`)
);
