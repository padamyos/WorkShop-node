const mongoose = require("mongoose");
const Schema = mongoose.Schema;



const productSchema = new Schema(
  {
    productname: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    img: {
      type: String, // ฟิลด์สำหรับเก็บ URL ของรูปภาพ
      required: false, // ไม่จำเป็นต้องมีค่า
    },
    
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
