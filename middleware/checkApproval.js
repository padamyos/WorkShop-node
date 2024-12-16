const jwt = require("jsonwebtoken");
const User = require("../models/user-model");
const secretKey = "1234"; // secret key for jwt

async function checkApproval(req, res, next) {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, secretKey);
    const user = await User.findById(decoded.data._id);
    if (!user || user.isstatus !== "approved") {
      return res.status(403).send({
        status: "error",
        message: "Access denied. User not approved.",
        data: [],
      });
    }

    req.user = user;
    next();
  } 
  catch (err) {
    res.status(401).send({
      status: "error",
      message: "Unauthorized",
      data: [],
    });
  }
}

module.exports = checkApproval;
