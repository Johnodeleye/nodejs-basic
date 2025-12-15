const { fetchUsers } = require("../services/user.service")
const sendResponse = require("../utils/name.util")

const getUsers = (req, res) => {
  const users = fetchUsers()
  sendResponse(res, users)
}

module.exports = { getUsers }
