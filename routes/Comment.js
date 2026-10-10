const express = require('express');
const commentSchema = require('../models/Comment');
const Router = express.Router();
const checkAuth = require('../middleware/Auth');
const jwt = require('jsonwebtoken');
const { default: mongoose } = require('mongoose');
require('dotenv').config();


Router.post('/new-comment/:videoId', checkAuth, async (req, res) => {
    try {

        const verifiedUser = await jwt.verify(req.headers.authorization.split(" ")[1], process.env.SECRET_KEY);
        const newComment = new commentSchema({
            _id: new mongoose.Types.ObjectId,
            videoId: req.params.videoId,
            userId: verifiedUser._id,
            commentText: req.body.commentText,
        })

        await newComment.save();
        res.status(200).json({
            newComment: newComment
        })



    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: 'Internal Server error'
        })

    }
})

//get all comment of a video 
Router.get('/:videoId', async (req, res) => {
    try {

        const comment = await commentSchema.find({ videoId: req.params.videoId }).populate('userId', 'channelName logoUrl');
        res.status(200).json({
            commentList: comment
        })

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: 'Internal Server error'
        })

    }
})

Router.put('/:commentId', checkAuth, async (req, res) => {
    try {

        const verifiedUser = await jwt.verify(req.headers.authorization.split(" ")[1], process.env.SECRET_KEY);

        const comment = await commentSchema.findById(req.params.commentId);

        if (comment.userId != verifiedUser._id) {
            return res.status(500).json({
                msg: "Invalid user"
            })
        }
        comment.commentText = req.body.commentText;
        await comment.save();
        res.status(200).json({
            msg: 'comment edited'
        })


    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: 'Internal sever error'
        })

    }
})

Router.delete('/:commentId', checkAuth, async (req, res) => {

    try {
        const verifiedUser = await jwt.verify(req.headers.authorization.split(" ")[1], process.env.SECRET_KEY);
        const comment = await commentSchema.findById(req.params.commentId);

        if (comment.userId != verifiedUser._id) {
            return res.status(500).json({
                msg: "Invalid user"
            })
        }

        const deletedComment = await commentSchema.findByIdAndDelete(req.params.commentId);

        res.status(200).json({
            deletedComment: deletedComment
        })

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: 'Internal server error'
        })

    }

})

module.exports = Router;