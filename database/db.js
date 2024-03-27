const mongoose = require('mongoose')
const url = 'mongodb://localhost:27017/passport'

const connectDb = async () => {
        await mongoose.connect(url)
}

module.exports = { connectDb }
