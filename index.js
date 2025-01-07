const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require("dotenv").config();

const app = express();
app.use(cors());

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.json({ code: 0, message: "Load mobile devices business application server successfully" });
});

app.use("/products", require("./routers/Product"))

app.use("/wishlist", require("./routers/Wishlist"))

app.use("/cart", require("./routers/Cart"))

app.use("/review", require("./routers/Review"))

app.use((req, res) => {
    res.json({ code: 2, message: "Path is not supported" });
});

const PORT = process.env.PORT || 3000;
const LINK = "http://localhost:" + PORT;
const { MONGODB_URI, DB_NAME } = process.env;
mongoose
    .connect(MONGODB_URI, {
        dbName: DB_NAME,
    })
    .then(() => {
        app.listen(PORT, () => {
            console.log(LINK);
        });
    })
    .catch((e) => console.log("Can not connect db server: " + e.message));