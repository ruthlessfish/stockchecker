const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const likeSchema = new Schema({
    ip: String,
    stock: String
});

module.exports = mongoose.model('like', likeSchema);