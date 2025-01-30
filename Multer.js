const express=require("express");
const path=require("path");
const cors=require("cors");
const multer=require("multer");
const { readdir } = require("fs");

const app=express();
app.use(cors());
app.use(express());
// form data parse
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, 'public')));

// const port=process.env || 5000;

app.get("/",(req,res)=>{
    res.send("Gopeshwar Kumar");
})


// steps to upload 
const storage=multer.diskStorage({
    destination:function(req,res,cb){
        return cb(null,"./upload");
    },
    filename:function(req,file,cb){
        cb(null, `${Date.now()}--${file.originalname}`);
    }
})
// upload your files
const upload=multer({storage:storage});

// image name taken in form input and upload
// for multiple files upload.fields({name:"img1"},{name:"img2"},{name:"img3"})
app.post("/upload",upload.single("imageName"),(req,res)=>{
    console.log(req.body);
    console.log(req.file);
    // return readdir("/");
})
app.listen(5000,()=>{
    console.log("Working on");
})

// nodemon start Multer.js