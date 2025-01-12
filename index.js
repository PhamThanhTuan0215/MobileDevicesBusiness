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

app.use("/wishlists", require("./routers/Wishlist"))

app.use("/carts", require("./routers/Cart"))

app.use("/orders", require("./routers/Order"))

app.use("/reviews", require("./routers/Review"))

app.use("/reports", require("./routers/Report"))

app.use("/customers", require("./routers/Customer"))

app.use("/managers", require("./routers/Manager"))

app.use("/discounts", require("./routers/Discount"))

app.use("/payments", require("./routers/Payment"))

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