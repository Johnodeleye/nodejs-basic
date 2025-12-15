const { fetchProducts } = require("../services/product.service")

const getAllProducts = (req, res) => {
  const products = fetchProducts()
  res.json(products)
}

module.exports = { getAllProducts }
