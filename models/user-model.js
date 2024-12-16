const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    employeeid: {
      type: String,
      unique: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      default: "NoName",
    },
    isstatus: {
      type: String,
      required: true,
      default: "NotApproved",
    },
  },
  {
    timestamp: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 60 * 60 * 1000), // บวก 7 ชั่วโมง
    },
  }
);

module.exports = mongoose.model("users", userSchema);
