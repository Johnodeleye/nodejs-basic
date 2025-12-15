const express = require("express")
const morgan = require("morgan")
const productRoutes = require("./routes/product.route")
const userRoutes = require("./routes/user.route")


const generateName = require("./utils/name.util")
const generateQuote = require("./utils/quote.util")

const app = express()

app.use(express.json())
app.use(morgan("dev"))

app.use("/api/users", userRoutes)
app.use("/api/products", productRoutes)

app.get("/", (req, res) => {
  res.json({
    message: "Nodejs Server is running now!",
    timestamp: new Date().toISOString()
  })
})

//  route to get a random name and quote
app.get("/random", (req, res) => {
  const randomName = generateName()  
  const randomQuote = generateQuote()  
  
  res.json({
    randomName,
    randomQuote
  })
})

app.listen(8000, () => {
  console.log("Server running on port 8000")
})
