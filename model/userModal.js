const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name:String,
    email:{
        type:String,
        unique:true
    },
    password:String

}, { timestamps: true })

const UserModal = mongoose.model('user', userSchema)
module.exports = UserModal