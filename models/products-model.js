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
    timestamp: { 
      type: Date, 
      default: () => new Date(Date.now() + 7 * 60 * 60 * 1000) // บวก 7 ชั่วโมง
    }
  }
);


module.exports = mongoose.model("Product", productSchema);
