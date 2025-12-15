//this is to generate random names 

const generateName = () => {
  const names = ["Alex", "Sam", "Jordan", "Chris"]
  return names[Math.floor(Math.random() * names.length)]
}

module.exports = generateName
