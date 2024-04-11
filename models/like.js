const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const likeSchema = new Schema({
    idAddress: String,
    stock: String
});

module.exports = mongoose.model('like', likeSchema);