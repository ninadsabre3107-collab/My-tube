const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    _id:mongoose.Schema.Types.ObjectId,
    videoId:{type: String , required: true},
    userId:{type: mongoose.Schema.Types.ObjectId , required: true , ref:'User'},
    commentText:{type: String , required: true},

} , {timestamps : true})

module.exports = mongoose.model('comment' , commentSchema);