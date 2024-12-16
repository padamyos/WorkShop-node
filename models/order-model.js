const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema({

  productname: {
    type: String,
    required: true,
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  order: {
    type: Number,
    required: true,
  },
  totlequantity: {
    type: Number,
    required: true,
  },
  totleprice: {
    type: Number,
    required: true,
  },
  orderDate: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 60 * 60 * 1000), // บวก 7 ชั่วโมง
  },
});

module.exports = mongoose.model("Order", orderSchema);
