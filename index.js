const cluster = require('node:cluster');
const env=require("dotenv")
env.config()
const os=require("os")
const express=require("express");
const cors=require("cors");
const nodemailer = require('nodemailer');
const jwt=require("jsonwebtoken");
const cookieparser=require("cookie-parser")
const bcrypt=require("bcrypt")
const citmodels=require("./Models/CitUserModels")
const citResult=require("./Models/ResultModels")
const admin=require("./Models/adminModel")
const questionmodel=require('./Models/questionsModel')
const answermodel=require('./Models/answerModel')

const numCPUs=os.cpus().length
// console.log(numCPUs)
const port=process.env.PORT || 3000

if(cluster.isPrimary) {
    // console.log(`Primary ${process.pid} is running`);
  
    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }
    
}else{

const app=express()

app.use(express.json()); // for POST requests
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieparser())



app.get("/",(req,res)=>{
    res.send({message:`Gopeshwar kumar ${process.pid} is running`})
})

// create user 
app.post("/create",async (req,res)=>{
    let createUser=await citmodels.findOne({"email":req.body.email})
    if(createUser){
        return res.send({message:"Email exists"})
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
    if(!createUser){
        return res.send({message:"User not registered"})
    }
    // compare the password
    const comparePassword=await bcrypt.compare(req.body.password,createUser.pass)
    if(!comparePassword){
        return res.send({message:"Wrong password"})
    }
    const usertoken=jwt.sign({user:"dhdjjs"},"djhbcjfekjidhidcecere")
    res.cookie('name',"hello",{httpOnly:true ,maxAge:36000000})
    // res.cookie('jwt',usertoken,{httpOnly:true ,maxAge:3600000})
    // console.log(res.cookie.jwt)

    res.send({message:"User loggedIn" , token:usertoken,name:createUser.candidatename,email:createUser.email})
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



// admin create user 
app.post("/admincreate",async (req,res)=>{
    let createadmin=await admin.findOne({"adminemail":req.body.adminemail})
    if(createadmin){
        return res.send({message:"Email exists"})
    }
    // hash the password
    const hashpassword=await bcrypt.hash(req.body.adminpassword , 12)
    const user=admin({"adminname":req.body.adminname,"adminemail":req.body.adminemail,"adminpassword":hashpassword})
    await user.save().then(ress =>{
        res.send({message:"Admin Registered successfully"})
    }).catch(err =>{
        res.send({message:"Failed! try again"})
    })
})

// Admin login user
app.post("/adminlogin",async(req,res)=>{
    let adminUser=await admin.findOne({"adminemail":req.body.adminemail})
    
    if(!adminUser){
        return res.send({message:"User not registered"})
    }

    // compare the password
    const comparepass=await bcrypt.compare(req.body.adminpassword,adminUser.adminpassword)
    
    if(!comparepass){
        return res.send({message:"Wrong password"})
    }
    
    const usertoken=jwt.sign({user:"dhdjjs"},"djhbcjfekjidhidcecere")
    res.send({message:"Admin LoggedIn",admintoken:usertoken,"AdminName":adminUser.adminname,"AdminEmail":adminUser.adminemail})
})

// create question
app.post('/createquestion',async(req,res)=>{
    const samequestion=await questionmodel.findOne({"question1":req.body.question1})
    if(samequestion){
        return res.send({message:"Question Existed !"})
    }
    const quest=new questionmodel(req.body)
    await quest.save().then(resultsave =>{
        res.send({message:"Question saved ..."})
    }).catch(err=>{
        res.status(403).send({message:"Error found ! "})
    })
})

// delete question
app.post('/deletequestion',async(req,res)=>{
    const deletequestion=await questionmodel.findOneAndDelete({"question1":req.body.deletequestion})
    res.send({message:"Deleted"})
})

// save answers
app.post('/saveanswers',async(req,res)=>{
    const answe=new answermodel(req.body)
    const existedAnswer=await answermodel.findOne({"userEmail":req.body.userEmail})
    if(existedAnswer){
        return res.send({message:"Answer already saved !"})
    }
    await answe.save().then(result =>{
        res.send({message:"Answer saved"})
    }).catch(er=>{
        res.status(403).send({message:"Error found !"})
    })
})

// getandshowquestion
app.get('/getandshowquestion',async(req,res)=>{
    const allQuestions=await questionmodel.find({})
    res.send(allQuestions)
})

// check user that test appeared or not
app.post('/checkuser',async(req,res)=>{
    const checkUser=await answermodel.findOne({"userEmail":req.body.userEmail})
    if(checkUser){
        return res.send({message:"User has appeared for test !"})
    }
})

// cit user test result
    app.post("/test",async (req,res)=>{
        const loggeduser = await citResult.findOne({ "email":req.body.email})

    const appearedUser=new citResult(req.body)
    await appearedUser.save().then(response=>{
        res.send({message:"Result saved !"})
    }).catch(err =>{
        res.send({message:err})
    })
    // console.log(req.body)
//     console.log(appearedUser)
// console.log(loggeduser)
})

// show users
app.get("/userscore",async(req,res)=>{
    // const leaderboard=await citResult.find({})
    const leaderboard=await answermodel.find({})
    res.send(leaderboard)
})


app.listen(port,()=>{
    console.log(`cit running on ${port}`)
})

}

// nodemon start index.js
// gopeshwar@gmail.com
// sonu@gmail.com