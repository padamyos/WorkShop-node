const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    employeeid:
    {
        type: String,
        unique: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    isstatus: { 
        type: String,  
        required: true,
        default: 'notapproved' },

}, {
    timestamps: true
});

module.exports = mongoose.model('users', userSchema);