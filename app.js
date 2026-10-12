const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/User');
const videoRoutes = require('./routes/Video');
const commentRoutes = require('./routes/Comment');
const bodyParser = require('body-parser');
const app = express();
const fileUpload = require('express-fileupload');
const cors = require('cors');
require('dotenv').config();


const connectwithdatabase = async()=>{
    try {
        const res = await mongoose.connect(process.env.MONGO_URL)
        console.log('connected with database...');
        
    } catch (err) {
        console.log(err);
        
    }
}

connectwithdatabase()

app.use(cors())
app.use(bodyParser.json())
app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : '/tmp/'
}));


app.use('/user' , userRoutes);
app.use('/video' , videoRoutes);
app.use('/comment' , commentRoutes);

app.get('/test' , (req, res)=>{
    res.status(200).json({
        msg : 'test api'
    })
})


module.exports = app ;