var express = require("express");
var router = express.Router();
var userSchema = require("../models/user-model");
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var userSchema = require("../models/user-model");
const { error } = require("console");

const secretKey = '1234'; // ควรเก็บเป็นความลับและไม่แชร์ในที่สาธารณะ

function generateToken(user) {
  return jwt.sign({ data: user }, secretKey, { expiresIn: '1h' });
}


/* GET users listing. */
router.get("/", async function (req, res, next) {
  let users = await userSchema.find({});

  res.send(users);
});
router.post("/", async function (req, res, next) {
  let { name, age } = req.body;

  let user = new userSchema({
    name,
    age,
  });
  await user.save();
  res.send(user);
});

// register route
router.post("/register", async function (req, res, next) {
  let { name, age, email, password } = req.body;

  // แฮชรหัสผ่านก่อนที่จะบันทึกลงในฐานข้อมูล
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  let user = new userSchema({
    name,
    age,
    email,
    password: hashedPassword,
  });

  await user.save();
  const token = generateToken(user);
  res.send({ user, token });
});

router.post("/login", async function (req, res, next) {
  let { email, password } = req.body;

  // ค้นหาผู้ใช้จากฐานข้อมูลโดยใช้อีเมล
  let user = await userSchema.findOne({ email });

  if (!user) {
    return res.status(400).send("User not found");
  }

  // เปรียบเทียบรหัสผ่านที่ผู้ใช้ป้อนเข้ามากับรหัสผ่านที่แฮชแล้วในฐานข้อมูล
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(400).send("Invalid password");
  }
  const token = generateToken(user);

  res.status(200).send({ user, token} );

});

module.exports = router;
