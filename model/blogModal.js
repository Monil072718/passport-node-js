const mongoose = require('mongoose')

const blogSchema = new mongoose.Schema({
    title: String,
    description: String,
    username: String,
    date: String,
    image:String

}, { timestamps: true })

const BlogModal = mongoose.model('blog', blogSchema)
module.exports = BlogModal 