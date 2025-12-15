//this is to generate random quotes
const generateQuote = () => {
  const quotes = [
    "Consistency beats talent",
    "Simple scales better",
    "Code is read more than written"
  ]
  return quotes[Math.floor(Math.random() * quotes.length)]
}

module.exports = generateQuote
