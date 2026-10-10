const express = require('express');
const Router = express.Router();
const checkAuth = require('../middleware/Auth');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const videoSchema = require('../models/Video');
const mongoose = require('mongoose');

// upload video
Router.post('/upload', checkAuth, async (req, res) => {

    try {

        const token = await req.headers.authorization.split(" ")[1];
        const user = jwt.verify(token, process.env.SECRET_KEY);
        console.log(user);
        const uploadedVideo = await cloudinary.uploader.upload(req.files.video.tempFilePath, { resource_type: 'video' });
        const uploadedThumbnail = await cloudinary.uploader.upload(req.files.thumbnail.tempFilePath);
        console.log(uploadedVideo);
        console.log(uploadedThumbnail);

        const newVideo = new videoSchema({
            _id: new mongoose.Types.ObjectId,
            userId: user._id,
            title: req.body.title,
            description: req.body.description,
            videoUrl: uploadedVideo.secure_url,
            videoId: uploadedVideo.public_id,
            thumbnailUrl: uploadedThumbnail.secure_url,
            thumbnailId: uploadedThumbnail.public_id,
            category: req.body.category,
            tags: req.body.tags.split(","),
        })

        const newUploadedVideoData = await newVideo.save();

        res.status(200).json({
            video:newUploadedVideoData
        })



    } catch (err) {
        console.log(err);

        return res.status(500).json({
            error: 'Internal server error'
        })
    }

})

//update video
Router.put('/:videoId' , checkAuth , async(req, res)=>{

    try {
        
        const verifiedUser = await jwt.verify(req.headers.authorization.split(" ")[1], process.env.SECRET_KEY)
        
        const video = await videoSchema.findById(req.params.videoId);
        
        if(video.userId == verifiedUser._id){
            if(req.files){
                await cloudinary.uploader.destroy(video.thumbnailId);
                const updatedThumbnail = await cloudinary.uploader.upload(req.files.thumbnail.tempFilePath)
                const updatedData = {
                    title: req.body.title,
                    description: req.body.description,
                    category: req.body.category,
                    tags: req.body.tags.split(","),
                    thumbnailUrl: updatedThumbnail.secure_url,
                    thumbnailId: updatedThumbnail.public_id,
                }
                const updatedVideoDetails = await videoSchema.findByIdAndUpdate(req.params.videoId , updatedData ,{new:true})
                console.log(updatedVideoDetails);
                
                res.status(200).json({
                    updatedData:updatedVideoDetails
                })

            }else{
                const updatedData = {
                    title: req.body.title,
                    description: req.body.description,
                    category: req.body.category,
                    tags: req.body.tags.split(","),
                    
                }
                const updatedVideoDetails = await videoSchema.findByIdAndUpdate(req.params.videoId , updatedData ,{new:true})
                // console.log(updatedVideoDetails);
                
                res.status(200).json({
                    updatedData:updatedVideoDetails
                })
            }
            
        }else{
            console.log("you do not have the access");
            
        }
        
        


    } catch (err) {
        console.log(err);

        res.status(500).json({
            Error:"Internal Server error"
        })
        
    }
})


//delete video
Router.delete('/:videoId', checkAuth , async(req , res)=>{

    try {
        const verifiedUser = await jwt.verify(req.headers.authorization.split(" ")[1], process.env.SECRET_KEY)
        const video = await videoSchema.findById(req.params.videoId);
        if(video.userId == verifiedUser._id){

            await cloudinary.uploader.destroy(video.videoId, {resource_type: "video"})
            await cloudinary.uploader.destroy(video.thumbnailId)
            const deletedVideo = await videoSchema.findByIdAndDelete(req.params.videoId);

            res.status(200).json({
                deletedVideo: deletedVideo
            })
        }else{
            res.status(500).json({
                error: "You cannot delete this video"
            })
        }
        
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error:"Internal Server error"
        })
        
    }


})

//like api
Router.put('/like/:videoId' , checkAuth , async(req , res)=>{
    try {
        const verifiedUser = await jwt.verify(req.headers.authorization.split(" ")[1], process.env.SECRET_KEY)
        const video = await videoSchema.findById(req.params.videoId);
        if(video.likedBy.includes(verifiedUser._id)){
            return res.status(500).json({
                msg:'Already liked'
            })
        }
        if(video.dislikedBy.includes(verifiedUser._id)){
            video.dislikes -= 1;
            video.dislikedBy = video.dislikedBy.filter(userId => userId.toString() != verifiedUser._id);
        }
        video.likes +=1;
        video.likedBy.push(verifiedUser._id);
        await video.save();
        res.status(200).json({
            msg:'Liked video'
        })
        
    } catch (err) {

        console.log(err);
        return res.status(500).json({
            error: 'Internal Server error'
        })
    }
})

//Dislike api
Router.put('/dislike/:videoId' , checkAuth , async(req , res)=>{
    try {
        const verifiedUser = await jwt.verify(req.headers.authorization.split(" ")[1], process.env.SECRET_KEY)
        const video = await videoSchema.findById(req.params.videoId);
        if(video.dislikedBy.includes(verifiedUser._id)){
            return res.status(500).json({
                msg:'Already disliked'
            })
        }
        if(video.likedBy.includes(verifiedUser._id)){
            video.likes -= 1;
            video.likedBy = video.likedBy.fliter(userId => userId.toString() != verifiedUser._id);
        }
        video.dislikes +=1;
        video.dislikedBy.push(verifiedUser._id);
        await video.save();
        res.status(200).json({
            msg:'Disliked video'
        })
        
    } catch (err) {

        console.log(err);
        return res.status(500).json({
            error: 'Internal Server error'
        })
    }
})

//views api

Router.put('/views/:videoId' , async (req , res)=>{
    try {

        const video = await  videoSchema.findById(req.params.videoId);
        video.views += 1 
        await video.save();
        res.status(200).json({
            msg:'ok'
        })
        
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            msg:'Internal server error'
        })
    }
})





module.exports = Router