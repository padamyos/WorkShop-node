var express = require("express");
var router = express.Router();
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
// schema
var Product = require("../models/products-model");
var User = require("../models/user-model");
var Order = require("../models/order-model");
// var Order = require("../models/order-model");

const { error } = require("console");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images");
  },
  filename: function (req, file, cb) {
    cb(null, new Date().getTime() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

const secretKey = "1234"; // ควรเก็บเป็นความลับและไม่แชร์ในที่สาธารณะ

function generateToken(user) {
  return jwt.sign({ data: user }, secretKey, { expiresIn: "24h" });
}

/* GET users listing. */
router.get("/", async function (req, res, next) {
  try {
    let users = await User.find({});
    res.send({
      status: "success",
      message: "Users retrieved successfully",
      data: users,
    });
  } catch (err) {
    res.status(500).send({
      status: "error",
      message: "Failed to retrieve users",
      data: [],
    });
  }
});

// สมัครสมาชิก
router.post("/register", async function (req, res, next) {
  try {
    let { email, password } = req.body;
    const employeeid = Math.floor(Math.random() * 1000000);

    // แฮชรหัสผ่านก่อนที่จะบันทึกลงในฐานข้อมูล
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    let user = new User({
      employeeid,
      email,
      password: hashedPassword,
    });

    await user.save();
    const token = generateToken(user);
    res.send({
      status: "success",
      message: "User registered successfully",
      data: { user, token },
    });
  } catch (err) {
    res.status(500).send({
      status: "error",
      message: "Failed to register user",
      data: [],
    });
  }
});

// เข้าสู่ระบบ
router.post("/login", async function (req, res, next) {
  try {
    let { email, password } = req.body;

    // ค้นหาผู้ใช้จากฐานข้อมูลโดยใช้อีเมล
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).send({
        status: "error",
        message: "User not found",
        data: [],
      });
    }

    // เปรียบเทียบรหัสผ่านที่ผู้ใช้ป้อนเข้ามากับรหัสผ่านที่แฮชแล้วในฐานข้อมูล
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).send({
        status: "error",
        message: "Invalid password",
        data: [],
      });
    }

    const token = generateToken(user);

    res.status(200).send({
      status: "success",
      message: "Login successful",
      data: { user, token },
    });
  } catch (err) {
    res.status(500).send({
      status: "error",
      message: "Failed to login",
      data: [],
    });
  }
});

// approve
router.put("/:employeeid/approve", async function (req, res, next) {
  try {
    let { employeeid } = req.params;
    let user = await User.findOne({ employeeid: employeeid });

    if (!user) {
      return res.status(400).send({
        status: "error",
        message: "User not found",
        data: [],
      });
    }

    user.isstatus = "approved";
    await user.save();

    res.send({
      status: "success",
      message: "User approved successfully",
      data: user,
    });
  } catch (err) {
    res.status(400).send({
      status: "error",
      message: "Failed to approve user",
      data: [],
    });
  }
});

// // Middleware ตรวจสอบการ approve ของ user
async function checkApproval(req, res, next) {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, secretKey);
    const user = await User.findById(decoded.data._id);
    if (!user || !user.isstatus == "approved") {
      return res.status(403).send({
        status: "error",
        message: "Access denied. User not approved.",
        data: [],
      });
    }
    // res.send(user.isstatus == "approved");

    req.user = user;
    next();
  } catch (err) {
    res.status(401).send({
      status: "error",
      message: "Unauthorized",
      data: [],
    });
  }
}
// ดึงข้อมูลสินค้า
router.get("/product", checkApproval, async function (req, res, next) {
  try {
    let products = await Product.find({});
    res.send({
      status: "success",
      message: "Product retrieved successfully",
      data: products,
    });
  } catch (err) {
    res.status(500).send({
      status: "error",
      message: "Failed to retrieve product",
      data: [],
    });
  }
});

router.post(
  "/product",
  checkApproval,
  upload.single("img"),
  async function (req, res, next) {
    try {
      let { productname, price, quantity } = req.body;
      let img = req.file ? req.file.filename : null;

      let newProduct = new Product({
        productname,
        price,
        quantity,
        img,
      });

      console.log(newProduct);
      await newProduct.save();
      res.send({
        status: "success",
        message: "Product added successfully",
        data: newProduct,
      });
    } catch (err) {
      console.log(err);
      res.status(500).send({
        status: "error",
        message: "Failed to add product",
        data: [],
      });
    }
  }
);

// แก้ไขรายละเอียดสินค้า
router.put("/product/:_id", checkApproval, async function (req, res, next) {
  try {
    let { _id } = req.params;
    let { productname, price, quantity } = req.body;

    let product = await Product.findById(_id);

    if (!product) {
      return res.status(400).send({
        status: "error",
        message: "Product not found",
        data: [],
      });
    }

    product.productname = productname;
    product.price = price;
    product.quantity = quantity;

    await product.save();

    res.send({
      status: "success",
      message: "Product updated successfully",
      data: product,
    });
  } catch (err) {
    res.status(500).send({
      status: "error",
      message: "Failed to update product",
      data: [],
    });
  }
});

// ลบสินค้า
router.delete("/product/:_id", checkApproval, async function (req, res, next) {
  try {
    let { _id } = req.params;

    let product = await Product.findById(_id);
    await product.deleteOne({ _id });
    res.send({
      status: "success",
      message: "Product deleted successfully",
      data: product,
    });
  } catch (err) {
    res.status(500).send({
      status: "error",
      message: "Failed to delete product",
      data: [],
    });
  }
});

// ดูรายละเอียดสินค้า 1 รายการ
router.get("/product/:_id", checkApproval, async function (req, res, next) {
  try {
    let { _id } = req.params;
    let product = await Product.findById(_id);
 
    res.send({
      status: "success",
      message: "Product retrieved successfully",
      data: product,
    });
  } catch (err) {
    res.status(500).send({
      status: "error",
      message: "Failed to retrieve product",
      data: [],
    });
  }
});

// สร้าง order
router.post("/product/:_id/order", checkApproval, async function (req, res, next) {
  try {
    let { _id } = req.params;
    let {  order } = req.body;

    // ค้นหาสินค้าในฐานข้อมูล
    let product = await Product.findById(_id);
    let productname = product.productname;
    
    if (!product) {
      return res.status(404).send({
        status: "error",
        message: "Product not found",
        data: []
      });
    }

    // ตรวจสอบว่า order quantity ไม่เกิน quantity ของสินค้า
    if (order > product.quantity) {
      return res.status(400).send({
        status: "error",
        message: "Order quantity exceeds available product quantity",
        data: []
      });
    }

    // สร้างคำสั่งซื้อใหม่
    let newOrder = new Order({
      productname,
      product: _id,
      order,
      totlequantity: product.quantity-order,
    });

    // ลดจำนวนสินค้าใน stock
    product.quantity -= order;
    await product.save();
    await newOrder.save();

    res.send({
      status: "success",
      message: "Order placed successfully",
      data: newOrder,
      // totle: product.quantity,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      status: "error",
      message: "Failed to place order",
      data: []
    });
  }
});

// ดูรายการ order ทั้งหมด
router.get("/order", checkApproval, async function (req, res, next) {
  try {
    let orders = await Order.find({});
    res.send({
      status: "success",
      message: "Orders retrieved successfully",
      data: orders
    });
  } catch (err) {
    res.status(500).send({
      status: "error",
      message: "Failed to retrieve orders",
      data: []
    });
  }
});



module.exports = router;
