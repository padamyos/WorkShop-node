var express = require("express");
var router = express.Router();
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
// schema
var Product = require("../models/products-model");
var User = require("../models/user-model");
var Order = require("../models/order-model");


const { error } = require("console");
const multer = require("multer");

const checkApproval = require("../middleware/checkApproval");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images");
  },
  filename: function (req, file, cb) {
    cb(null, new Date().getTime() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

const secretKey = "1234"; // secret key for jwt
function generateToken(user) {
  return jwt.sign({ data: user }, secretKey, { expiresIn: "24h" });
}

/* GET users listing. */
router.get("/", async function (req, res, next) {
  try {
    let users = await User.find({});
    res.send({
      status: 200,
      message: " ดึงข้อมูลผู้ใช้สำเร็จ ",
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
    let { email, password, name } = req.body;
    const employeeid = Math.floor(Math.random() * 1000000);

    // แฮชรหัสผ่านก่อนที่จะบันทึกลงในฐานข้อมูล
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    let user = new User({
      employeeid,
      email,
      name,
      password: hashedPassword,
    });

    await user.save();
    const token = generateToken(user);
    res.send({
      status: 200,
      message: " สมัครสมาชิกสำเร็จ ",
      data: { user, token },
    });
  } catch (err) {
    res.status(500).send({
      status: "error",
      message: " ไม่สามารถสมัครสมาชิกได้ ",
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
        message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
        data: [],
      });
    }

    const token = generateToken(user);

    res.status(200).send({
      status: 200,
      message: "เข้าสู่ระบบสำเร็จ",
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
        message: " ไม่พบผู้ใช้ ",
        data: [],
      });
    }

    user.isstatus = "approved";
    await user.save();

    res.send({
      status: 200,
      message: " ผู้ใช้ได้รับการอนุมัติแล้ว ",
      data: user,
    });
  } catch (err) {
    res.status(400).send({
      status: "error",
      message: " ไม่สามารถอนุมัติผู้ใช้ได้ ",
      data: [],
    });
  }
});

// // Middleware ตรวจสอบการ approve ของ user
// async function checkApproval(req, res, next) {
//   try {
//     const token = req.headers.authorization.split(" ")[1];
//     const decoded = jwt.verify(token, secretKey);
//     const user = await User.findById(decoded.data._id);
//     if (!user || !user.isstatus == "approved") {
//       return res.status(403).send({
//         status: "error",
//         message: "Access denied. User not approved.",
//         data: [],
//       });
//     }
//     // res.send(user.isstatus == "approved");

//     req.user = user;
//     next();
//   } catch (err) {
//     res.status(401).send({
//       status: "error",
//       message: "Unauthorized",
//       data: [],
//     });
//   }
// }

// ดึงข้อมูลสินค้า
router.get("/product", checkApproval, async function (req, res, next) {
  try {
    let products = await Product.find({});
    res.send({
      status: 200,
      message: " ดึงข้อมูลสินค้าสำเร็จ ",
      data: products,
    });
  } catch (err) {
    res.status(500).send({
      status: "error",
      message: " ไม่สามารถดึงข้อมูลสินค้าได้ ",
      data: [],
    });
  }
});

// เพิ่มสินค้า
router.post("/product", checkApproval, upload.single("img"), async function (req, res, next) {
  try {
    let { productname, price, quantity } = req.body;
    let img = req.file ? `/public/images/${req.file.filename}` : null;

    let newProduct = new Product({
      productname,
      price,
      quantity,
      img,
    });

    console.log(newProduct);
    await newProduct.save();
    res.send({
      status: 200,
      message: " สินค้าถูกเพิ่มเรียบร้อยแล้ว ",
      data: newProduct,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      status: "error",
      message: " ไม่สามารถเพิ่มสินค้าได้ ",
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
      status: 200,
      message: " แก้ไขสินค้าสำเร็จ ",
      data: product,
    });
  } catch (err) {
    res.status(500).send({
      status: "error",
      message: " ไม่สามารถแก้ไขสินค้าได้ ",
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
      status: 200,
      message: " ลบสินค้าสำเร็จ ",
      data: product,
    });
  } catch (err) {
    res.status(500).send({
      status: "error",
      message: " ไม่สามารถลบสินค้าได้ ",
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
      status: 200,
      message: " ดึงข้อมูลสินค้าสำเร็จ ",
      data: product,
    });
  } catch (err) {
    res.status(500).send({
      status: "error",
      message: " ไม่สามารถดึงข้อมูลสินค้าได้ ",
      data: [],
    });
  }
});

// สร้าง order
router.post(
  "/product/:_id/order",
  checkApproval,
  async function (req, res, next) {
    try {
      let { _id } = req.params;
      let { order } = req.body;

      // ค้นหาสินค้าในฐานข้อมูล
      let product = await Product.findById(_id);
      let productname = product.productname;

      if (!product) {
        return res.status(404).send({
          status: "error",
          message: " ไม่พบสินค้า ",
          data: [],
        });
      }

      // ตรวจสอบว่า order quantity ไม่เกิน quantity ของสินค้า
      if (order > product.quantity) {
        return res.status(400).send({
          status: "error",
          message: "ไม่สามารถสั่งซื้อได้ เนื่องจากเกินจำนวนสินค้า",
          data: [],
        });
      }

      // สร้างคำสั่งซื้อใหม่
      let newOrder = new Order({
        productname,
        product: _id,
        order,
        totlequantity: product.quantity - order,
        totleprice: product.price * order,
      });

      // ลดจำนวนสินค้าใน stock
      product.quantity -= order;
      await product.save();
      await newOrder.save();

      res.send({
        status: 200,
        message: "เพิ่ม order สำเร็จ",
        data: newOrder,
        // totle: product.quantity,
      });
    } catch (err) {
      console.log(err);
      res.status(500).send({
        status: "error",
        message: "ไม่สามารถสั่งซื้อได้",
        data: [],
      });
    }
  }
);

// ดูรายการ order ทั้งหมด
router.get("/order", checkApproval, async function (req, res, next) {
  try {
    let orders = await Order.find({});

    // ดึงข้อมูลเฉพาะที่ต้องการ
    // let allorder = 
    //   orders.map((order) => {
    //     return {
    //       // ชื่อสินค้า
    //       productname: order.productname,
    //       // จำนวนสินค้าที่สั่ง
    //       order: order.order,
    //       // จำนวนสินค้าที่เหลือ
    //       totlequantity: order.totlequantity,
    //       // วันที่สั่ง
    //       orderdate: order.orderDate,
    //     };
    //   });

    res.send({
      status: 200,
      message: " ดึงข้อมูล order สำเร็จ ",
      data: orders,
    });
  } catch (err) {
    res.status(500).send({
      status: "error",
      message: " ไม่สามารถดึงข้อมูล order ได้ ",
      data: [],
    });
  }
});

// ลบ order ที่สั่ง
router.delete("/order/:_id", checkApproval, async function (req, res, next) {
  try {
    let { _id } = req.params;
    let order = await Order.findById(_id);
    if (!order) {
      return res.status(404).send({
        status: "error",
        message: " ไม่พบ order ",
        data: [],
      });
    }
    await order.deleteOne({ _id });
    res.send({
      status: 200,
      message: " ลบ order สำเร็จ ",
      data: order,
    });
  } catch (err) {
    res.status(500).send({
      status: "error",
      message: " ไม่สามารถลบ order ได้ ",
      data: [],
    });
  }
}
);

module.exports = router;
