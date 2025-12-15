const express = require("express")
const auth = require("../middleware/auth.middleware")
const { getAllProducts } = require("../controllers/product.controller")

const router = express.Router()

router.get("/", auth, getAllProducts)

module.exports = router
