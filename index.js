const cluster = require('node:cluster');
const os=require("os")
const express=require("express");
const cors=require("cors");
const nodemailer = require('nodemailer');
const jwt=require("jsonwebtoken");
const bcrypt=require("bcrypt")
const citmodels=require("./Models/CitUserModels")
// const citResult=require("./Models/ResultModels")

const numCPUs=os.cpus().length
// console.log(numCPUs)

if(cluster.isPrimary) {
    // console.log(`Primary ${process.pid} is running`);
  
    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }
    
}else{

const app=express()

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cors());

app.get("/",(req,res)=>{
    res.send({message:`Gopeshwar ${process.pid} is running`})
})

// create user 
app.post("/create",async (req,res)=>{
    let createUser=await citmodels.findOne({"email":req.body.email})
    if(createUser){
        return res.send({message:"Email already exist"})
    }
    // hash the password
    const hashpassword=await bcrypt.hash(req.body.pass , 12)
    const user=citmodels({"candidatename":req.body.candidatename,"email":req.body.email,"pass":hashpassword})
    await user.save().then(ress =>{
        res.send({message:"Registered successfully"})
    }).catch(err =>{
        res.send({message:"Failed! try again"})
    })
})

// login user
app.post("/login",async(req,res)=>{
    let createUser=await citmodels.findOne({"email":req.body.email})
    console.log(createUser.candidatename)
    console.log(createUser.email)
    if(!createUser){
        return res.send({message:"User not registered"})
    }
    // compare the password
    const comparePassword=await bcrypt.compare(req.body.password,createUser.pass)
    if(!comparePassword){
        return res.send({message:"Wrong password"})
    }
    const usertoken=jwt.sign({user:"dhdjjs"},"djhbcjfekjidhidcecere")
    res.send({message:"user found" , token:usertoken,name:createUser.candidatename,email:createUser.email})
})

// forgotpassword
app.post("/forgotpassword",async(req,res)=>{
    let createUser=await citmodels.findOne({"email":req.body.email})
// console.log(createUser.email)
    if(!createUser){
        return res.send({message:"User does not exist!"})
    }

    const otp = Math.floor(Math.random() * 10000)
    createUser.updateOne({ "otp": otp }).then(resws =>{
        // console.log("success otp saved")
        res.send({message:"otp sent to email"})
        }).catch(er =>{
          console.log(er)
        })
        console.log("otp,",otp)

// Create a transporter using your email
let transporter = nodemailer.createTransport({
  service: 'gmail',  // You can use other services like 'hotmail', 'yahoo', etc.
  auth: {
    user: 'uniquedevil21@gmail.com',  // Replace with your email
    pass: 'pdjxbzqmpdijwhae',   // Replace with your email password or app password
  },
});

// Set up email data ${createUser.email}
let mailOptions = {
  from: 'uniquedevil21@gmail.com',  // Sender address
  to: createUser.email,   // List of recipients
  subject: 'Reset password',  // Subject line
  text: `otp is ${otp}`,  // Plain text body
  // html: '<p>Hello, this is a test email sent using Nodemailer!</p>'  // If you prefer HTML format
};
// Send the email
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    return console.log('Error sending email:', error);
  }
  res.send({message:"otp sent to email"})
});

})

// newpassword
app.post("/newpassword", async(req,res)=>{
    let newpassUser=await citmodels.findOne({"otp":req.body.otp})
    if(!newpassUser){
        res.send({message:"wrong otp"})
    }
    const hashnewpassword=await bcrypt.hash(req.body.newusepassword, 12)
    citmodels.updateOne({"pass":hashnewpassword}).then(re =>{
        res.send({message:"password changed successfully"})
    })
})

// cit user test result
    app.post("/test",async (req,res)=>{
        const user = await citmodels.findOne({ "email":req.body.testemail })
        if (!user) {
        return res.send({ message: "Wrong Email" });
    }
console.log(req.body)
console.log(user)
    // Update user's answers
        if(user.email===req.body.testemail){
            user.updateOne(req.body).then(reee =>{
                res.send({ message: "Answers saved successfully" })
            }).catch(errr =>{
                console.log(err)
            res.send({ message: "Failed to save answers. Try again." });
            })
        }
})

// show marks
app.get("/marks",async(req,res)=>{
    let marks=0;
    let usermarks=await citmodels.find({})
    
})
// show users
app.get("/users",async(req,res)=>{
    const leaderboard=await citmodels.find();
    res.json(leaderboard);
})

app.listen(5000,()=>{
    // console.log(`cit On 5000 Port ${process.pid}`)
})

}

// nodemon start cit.js
// gopeshwarkumark@gmail.com
// utkarsh@gmail.com