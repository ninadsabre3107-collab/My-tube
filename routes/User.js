const express = require('express');
const Router = express.Router();
const bcrypt = require('bcrypt');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();
const User = require('../models/User');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const checkAuth = require('../middleware/Auth');

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

//signup api
Router.post('/signup', async (req, res) => {
    try {

        const users = await User.find({ email: req.body.email })
        if (users.length > 0) {
            return res.status(500).json({
                error: 'email already registered.'
            })
        }

        const hashCode = await bcrypt.hash(req.body.password, 10);

        const uploadedImage = await cloudinary.uploader.upload(req.files.logo.tempFilePath);

        const newUser = new User({
            _id: new mongoose.Types.ObjectId,
            channelName: req.body.channelName,
            email: req.body.email,
            phone: req.body.phone,
            password: hashCode,
            logoUrl: uploadedImage.secure_url,
            logoId: uploadedImage.public_id
        })

        const user = await newUser.save()
        res.status(200).json({
            newUser: user
        })



    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: 'Internal Server error'
        })

    }
})

//login api
Router.post('/login', async (req, res) => {
    try {
        console.log(req.body);

        const user = await User.find({ email: req.body.email });
        console.log(user);

        if (user.length == 0) {
            return res.status(500).json({
                error: 'Mail is not registered'
            })
        }

        const isValid = await bcrypt.compare(req.body.password, user[0].password);

        if (!isValid) {
            return res.status(500).json({
                error: "Invalid Password"
            })
        }

        const token = jwt.sign({
            _id: user[0]._id,
            channelName: user[0].channelName,
            email: user[0].email,
            phone: user[0].phone,
            password: user[0].password,
            logoId: user[0].logoId,
        },
            process.env.SECRET_KEY, {
            expiresIn: '365d'
        }
        )

        res.status(200).json({
            _id: user[0]._id,
            channelName: user[0].channelName,
            email: user[0].email,
            phone: user[0].phone,
            password: user[0].password,
            logoUrl: user[0].logoUrl,
            logoId: user[0].logoId,
            subscriber: user[0].subscribers,
            subscribedChannel: user[0].subscribedChannels,
            token: token
        })



    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: 'Internal Server error'
        })
    }
})


//subscribe api
Router.put('/subscribe/:userBId', checkAuth, async (req, res) => {
    try {
        const userA = await jwt.verify(req.headers.authorization.split(" ")[1], process.env.SECRET_KEY)
        const userB = await User.findById(req.params.userBId);
        if (userB.subscribedBy.includes(userA._id)) {
            return res.status(500).json({
                msg: 'Already subscribed'
            })
        }
        userB.subscribers += 1;
        userB.subscribedBy.push(userA._id);
        await userB.save();
        const userAInfo = await User.findById(userA._id);
        userAInfo.subscribedChannels.push(userB._id);
        await userAInfo.save();
        res.status(200).json({
            msg: 'Subscribed'
        })
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: 'Internal server error'
        })

    }

})

//unsubscbribe api
Router.put('/unsubscribe/:userBId', checkAuth, async (req, res) => {
    try {
        const userA = await jwt.verify(req.headers.authorization.split(" ")[1], process.env.SECRET_KEY)
        const userB = await User.findById(req.params.userBId);
        if(!userB.subscribedBy.includes(userA._id)){
            return res.status(500).json({
                msg:'You have to subscribe first'
            })
        }

        userB.subscribers -= 1;
        userB.subscribedBy =  await userB.subscribedBy.filter(userId => userId.toString() != userA._id);
        userB.save();
        const userAInfo = await User.findById(userA._id);
        userAInfo.subscribedChannels = userAInfo.subscribedChannels.filter(userId => userId.toString() != userB._id);  
        await userAInfo.save();

        res.status(200).json({
            msg: 'Unsubscribed Channel'
        })

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            msg: "Internal Server Error"
        })

    }

})

module.exports = Router