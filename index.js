const cluster = require("node:cluster");
const env = require("dotenv");
env.config();
const os = require("os");
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const cookieparser = require("cookie-parser");
const bcrypt = require("bcrypt");
const citmodels = require("./Models/CitUserModels");
const citResult = require("./Models/ResultModels");
const admin = require("./Models/adminModel");
const questionmodel = require("./Models/questionsModel");
const answermodel = require("./Models/answerModel");
const middleware = require("./middleware/middleware");

const socket = require("socket.io");
const { Server } = require("socket.io");
const http = require("http");

const app = express();
const httpServer = http.createServer(app);

// Proper CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: `${process.env.FRONTEND_URL}`, // Replace with your frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// socket connection
io.on("connection", (socket) => {
  // console.log(`Id:- ${socket.id}`)

  //  Admin Recieving message from frotend
  socket.on("message", (data) => {
    io.emit("Backlatitude", data);
  });

  //  User Recieving message from frotend
  socket.on("freindmessage", (data) => {
    io.emit("sentBack", data);
  });
});

const numCPUs = os.cpus().length;
// console.log(numCPUs)
const port = process.env.PORT || 3000;

if (cluster.isPrimary) {
  // console.log(`Primary ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  app.use(express.json()); // for POST requests
  app.use(express.urlencoded({ extended: true }));
  app.use(
    cors({
      origin: process.env.FRONTEND_URL,
      credentials: true,
    })
  );
  app.use(cookieparser());

  app.get("/", middleware, (req, res) => {
    res.send({ message: `Gopeshwar kumar ${process.pid} is running` });
  });

  // create user
  app.post("/create", async (req, res) => {
    let createUser = await citmodels.findOne({ email: req.body.email });
    // const Id = createUser._id.toString();

    if (createUser) {
      return res.send({ message: "Email exists" });
    }
    // hash the password
    const hashpassword = await bcrypt.hash(req.body.pass, 12);
    // Create JWT token
    // const usertoken = jwt.sign({ "id": createUser._id }, process.env.JWT_SECRET_KEY, {
    //   expiresIn: 24*60*60*1000,
    // });
    // save the data
    const user = citmodels({
      candidatename: req.body.candidatename,
      email: req.body.email,
      pass: hashpassword,
      otp: req.body.otp,
    });
    await user
      .save()
      .then((ress) => {
        // set the cookies
        // res.cookie('usertoken', usertoken, {
        // httpOnly: true,
        // secure: false,
        // maxAge: 3600000,});

        res.send({ message: "Registered successfully", usertoken });
      })
      .catch((err) => {
        res.send({ message: "Failed! try again" });
      });

    // Create a transporter using your email
    let transporter = nodemailer.createTransport({
      service: "gmail", // You can use other services like 'hotmail', 'yahoo', etc.
      auth: {
        user: "uniquedevil21@gmail.com", // Replace with your email
        pass: "pdjxbzqmpdijwhae", // Replace with your email password or app password
      },
    });

    // Set up email data ${createUser.email}
    let mailOptions = {
      from: "uniquedevil21@gmail.com", // Sender address
      to: req.body.email, // List of recipients
      subject: "Login Link", // Subject line
      text: `http://localhost:3000/Login`, // Plain text body
      // html: '<p>Hello, this is a test email sent using Nodemailer!</p>'  // If you prefer HTML format
    };
    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log("Error sending email:", error);
      }
      res.send({ message: "Login Link sent to your email" });
    });
  });

  // login user
  app.post("/login", async (req, res) => {
    try {
      let createUser = await citmodels.findOne({ email: req.body.email });
      if (createUser.userType == "Unverified") {
        return res.send({ message: "Un-Verified User" });
      }
      if (!createUser) {
        return res.send({ message: "User not registered" });
      }
      // compare the password
      const comparePassword = await bcrypt.compare(
        req.body.password,
        createUser.pass
      );
      if (!comparePassword) {
        return res.send({ message: "Wrong password" });
      }

      const usertoken = jwt.sign(
        { id: createUser._id },
        process.env.JWT_SECRET_KEY // optional: token expiry
      );
      res.cookie("usertoken", usertoken);

      res.send({
        message: "User loggedIn",
        name: createUser.candidatename,
        email: createUser.email,
      });
    } catch (error) {
      res.status(403).send("login error");
    }
  });

  // Log out
app.get('/logout',middleware, (req, res) => {
  try {
    res.clearCookie('usertoken', {
      httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production',
    //   sameSite: 'strict',
    });

    res.status(200).send({ message: 'Log out successfully' });
  } catch (error) {
    res.status(500).send({ message: 'Logout error', error: error.message });
  }
});

  //User profile
  app.get("/profile", middleware, (req, res) => {
    const userinfo = req.user;
    res.send(userinfo)
  });

  // Verify Email
  app.post("/sendotpToVerifyemail", middleware,async (req, res) => {
    const createUser = await citmodels.findOne({ email: req.body.email });
    if (!createUser) {
      res.send({ message: "User email Not found" });
    }

    const otp = Math.floor(Math.random() * 10000);

    await createUser.updateOne({ otp: otp });
    // Create a transporter using your email
    let transporter = nodemailer.createTransport({
      service: "gmail", // You can use other services like 'hotmail', 'yahoo', etc.
      auth: {
        user: "uniquedevil21@gmail.com", // Replace with your email
        pass: "pdjxbzqmpdijwhae", // Replace with your email password or app password
      },
    });

    // Set up email data ${createUser.email}
    let mailOptions = {
      from: "uniquedevil21@gmail.com", // Sender address
      to: req.body.email, // List of recipients
      subject: "Verify Email", // Subject line
      text: `Email Verification otp is ${otp}`, // Plain text body
      // html: '<p>Hello, this is a test email sent using Nodemailer!</p>'  // If you prefer HTML format
    };
    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log("Error sending email:", error);
      }
      res.send({ message: "otp sent to email" });
    });
  });

  // verify email otp
  app.post("/VerifyemailOtp",middleware, async (req, res) => {
    const verifiedUser = await citmodels.findOne({ otp: req.body.otp });
    if (!verifiedUser) {
      res.send({ message: "Wrong otp" });
    } else {
      await verifiedUser.updateOne({ userType: "Verified" });
      res.send({ message: "otp verified" });
    }
  });

  // forgotpassword
  app.post("/forgotpassword", middleware,async (req, res) => {
    let createUser = await citmodels.findOne({ email: req.body.email });
    // console.log(createUser.email)
    if (!createUser) {
      return res.send({ message: "User does not exist!" });
    }

    const otp = Math.floor(Math.random() * 10000);
    createUser
      .updateOne({ otp: otp })
      .then((resws) => {
        // console.log("success otp saved")
        res.send({ message: "otp sent to email" });
      })
      .catch((er) => {
        //   console.log(er)
        res.send("Error !");
      });
    // console.log("otp,",otp)

    // Create a transporter using your email
    let transporter = nodemailer.createTransport({
      service: "gmail", // You can use other services like 'hotmail', 'yahoo', etc.
      auth: {
        user: "uniquedevil21@gmail.com", // Replace with your email
        pass: "pdjxbzqmpdijwhae", // Replace with your email password or app password
      },
    });

    // Set up email data ${createUser.email}
    let mailOptions = {
      from: "uniquedevil21@gmail.com", // Sender address
      to: createUser.email, // List of recipients
      subject: "Reset password", // Subject line
      text: `otp is ${otp}`, // Plain text body
      // html: '<p>Hello, this is a test email sent using Nodemailer!</p>'  // If you prefer HTML format
    };
    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log("Error sending email:", error);
      }
      res.send({ message: "otp sent to email" });
    });
  });

  // newpassword
  app.post("/newpassword", middleware,async (req, res) => {
    let newpassUser = await citmodels.findOne({ otp: req.body.otp });
    if (!newpassUser) {
      res.send({ message: "wrong otp" });
    }
    const hashnewpassword = await bcrypt.hash(req.body.newusepassword, 12);
    await newpassUser.updateOne({ pass: hashnewpassword }).then((re) => {
      res.send({ message: "Password Changed" });
    });
  });

  // admin create user
  app.post("/admincreate", async (req, res) => {
    let createadmin = await admin.findOne({ adminemail: req.body.adminemail });
    if (createadmin) {
      return res.send({ message: "Email exists" });
    }
    // hash the password
    const hashpassword = await bcrypt.hash(req.body.adminpassword, 12);
    const user = admin({
      adminname: req.body.adminname,
      adminemail: req.body.adminemail,
      adminpassword: hashpassword,
    });
    await user
      .save()
      .then((ress) => {
        res.send({ message: "Admin Registered successfully" });
      })
      .catch((err) => {
        res.send({ message: "Failed! try again" });
      });
  });

  // Admin login user
  app.post("/adminlogin", async (req, res) => {
    let adminUser = await admin.findOne({ adminemail: req.body.adminemail });

    if (!adminUser) {
      return res.send({ message: "User not registered" });
    }

    // compare the password
    const comparepass = await bcrypt.compare(
      req.body.adminpassword,
      adminUser.adminpassword
    );

    if (!comparepass) {
      return res.send({ message: "Wrong password" });
    }

    const usertoken = jwt.sign(
      { id: adminUser._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: 24 * 60 * 60 * 1000 }
    );
    res.send({
      message: "Admin LoggedIn",
      admintoken: usertoken,
      AdminName: adminUser.adminname,
      AdminEmail: adminUser.adminemail,
    });
  });

  // create question
  app.post("/createquestion", async (req, res) => {
    const samequestion = await questionmodel.findOne({
      question1: req.body.question1,
    });
    if (samequestion) {
      return res.send({ message: "Question Existed !" });
    }
    const quest = new questionmodel(req.body);
    await quest
      .save()
      .then((resultsave) => {
        res.send({ message: "Question saved ..." });
      })
      .catch((err) => {
        res.status(403).send({ message: "Error found ! " });
      });
  });

  // delete question
  app.post("/deletequestion", async (req, res) => {
    const deletequestion = await questionmodel.findOneAndDelete({
      question1: req.body.deletequestion,
    });
    console.log(req.body);
    if (!deletequestion) {
      return res.send({ message: "Question not found !" });
    }
    res.send({ message: "Question Deleted" });
  });

  // Update Question
  app.post("/updatequestion", async (req, res) => {
    const updateQuestion = await questionmodel.findById(req.body.QuestionId);

    if (updateQuestion) {
      await updateQuestion
        .updateOne(req.body)
        .then((res) => {
          res.send({ messsage: "Question updated" });
        })
        .catch((err) => {
          res.send({ messsage: "error" });
        });
    } else {
      return res.send({ messsage: "Question not found" });
    }
  });

  // User Appeared Test
  // app.post('/appeared',async(req,res)=>{
  //     const existedAnswer=await answermodel.findOne({"userEmail":req.body.userEmail})
  //     if(existedAnswer){
  //         return res.send("User Appeared for test")
  //     }
  //     const appear=answermodel({"userEmail":req.body.userEmail,"userName":req.body.userName})
  //     await appear.save().then(res=>{
  //         res.send("Info Saved")
  //     }).catch(err=>{
  //         res.send("Error info saving !")
  //     })
  // })

  // check user that test appeared or not
  
  app.get("/checkuser",middleware, async (req, res) => {
    const userinfo=req.user
    const checkUser = await answermodel.findOne({
      userEmail: userinfo.email,
    });

    if (checkUser) {
      res.send({ message: "User has appeared for test !" });
    } else {
      res.send({ message: "User has not appeared for test !" });
    }
  });

  // save answers
  app.post("/saveanswers", async (req, res) => {
    const correctAnswers = {
      0: "gjygy",
      1: "kbjhbj",
      2: "jhjg",
      3: "hgchf",
      4: "kjbkuh",
      5: "jkbhkjh",
      6: "dgvjs",
      7: "kyui",
      8: "hggbuk",
      9: "juhugh",
      10: "mbmxkj",
      11: "m897987",
      12: "hggbuk",
      13: "khk",
      14: "rajya",
      15: "nepal",
      16: "delhi",
      17: "water",
      18: "death",
      19: "ground",
      20: "wise",
    };
    const { answers, userName, userEmail } = req.body;
    const existedAnswer = await answermodel.findOne({
      userEmail: req.body.userEmail,
    });
    if (existedAnswer) {
      return res.send({ message: "Answer already saved !" });
    }
    // 2. Calculate marks
    let marks = 0;
    for (let key in correctAnswers) {
      const givenAnswer = answers[key];
      const correctAnswer = correctAnswers[key];

      if (
        givenAnswer &&
        givenAnswer.toString().trim().toLowerCase() ===
          correctAnswer.toString().trim().toLowerCase()
      ) {
        marks += 4;
      }
    }

    // 3. Save new answer doc with userType Completed
    const newAnswer = new answermodel({
      userName,
      userEmail,
      answers,
      marks,
      userType: "Completed",
    });

    await newAnswer.save();

    // 4. Return success
    return res.status(200).send({ message: "Answer saved" });
  });

  // getandshowquestion
  app.get("/getandshowquestion", async (req, res) => {
    const allQuestions = await questionmodel.find({});
    res.send(allQuestions);
  });

  // cit user test result
  app.post("/test", async (req, res) => {
    const loggeduser = await citResult.findOne({ email: req.body.email });

    const appearedUser = new citResult(req.body);
    await appearedUser
      .save()
      .then((response) => {
        res.send({ message: "Result saved !" });
      })
      .catch((err) => {
        res.send({ message: err });
      });
    // console.log(req.body)
    //     console.log(appearedUser)
    // console.log(loggeduser)
  });

  // show users
  app.get("/userscore", async (req, res) => {
    //   try {
    //     const leaderboard = await answermodel.find({});

    //     const correctAnswers = {
    //       "1": "gjygy",
    //       "3": "physical",
    //       "4": "Africa",
    //       "5": "Niece",
    //       "6": "No"
    //     };

    //     const result = leaderboard.map(user => {
    //       const answers = Array.isArray(user.answers) ? user.answers[0] : user.answers;
    //       let marks = 0;

    //       for (let key in correctAnswers) {
    //         if (answers[key] && answers[key].toLowerCase() === correctAnswers[key].toLowerCase()) {
    //           marks += 4;
    //         }
    //       }

    //       return {
    //         name: user.userName,
    //         email: user.userEmail,
    //         mark: marks
    //       };
    //     });

    //     res.send(result)
    //   } catch (error) {
    //     console.error("Error calculating scores:", error);
    //     res.status(500).send({ error: "Internal Server Error" });
    //   }

    const leaderboard = await answermodel.find({});
    res.send(leaderboard);
  });

  httpServer.listen(port, () => {
    console.log(`cit running on ${port}`);
  });
}

// nodemon start index.js

// const cluster = require('node:cluster');
// const env=require("dotenv")
// env.config()
// const os=require("os")
// const express=require("express");
// const cors=require("cors");
// const nodemailer = require('nodemailer');
// const jwt=require("jsonwebtoken");
// const cookieparser=require("cookie-parser")
// const bcrypt=require("bcrypt")
// const citmodels=require("./Models/CitUserModels")
// const citResult=require("./Models/ResultModels")
// const admin=require("./Models/adminModel")
// const questionmodel=require('./Models/questionsModel')
// const answermodel=require('./Models/answerModel')

// const numCPUs=os.cpus().length
// // console.log(numCPUs)
// const port=process.env.PORT || 3000

// if(cluster.isPrimary) {
//     // console.log(`Primary ${process.pid} is running`);

//     // Fork workers.
//     for (let i = 0; i < numCPUs; i++) {
//       cluster.fork();
//     }

// }else{

// const app=express()

// app.use(express.json()); // for POST requests
// app.use(express.urlencoded({ extended: true }));
// app.use(cors());
// app.use(cookieparser())

// app.get("/",(req,res)=>{
//     res.send({message:`Gopeshwar kumar ${process.pid} is running`})
// })

// // create user
// app.post("/create",async (req,res)=>{
//     let createUser=await citmodels.findOne({"email":req.body.email})
//     if(createUser){
//         return res.send({message:"Email exists"})
//     }
//     // hash the password
//     const hashpassword=await bcrypt.hash(req.body.pass , 12)
//     const user=citmodels({"candidatename":req.body.candidatename,"email":req.body.email,"pass":hashpassword})
//     await user.save().then(ress =>{
//         res.send({message:"Registered successfully"})
//     }).catch(err =>{
//         res.send({message:"Failed! try again"})
//     })
// })

// // login user
// app.post("/login",async(req,res)=>{
//     let createUser=await citmodels.findOne({"email":req.body.email})
//     if(!createUser){
//         return res.send({message:"User not registered"})
//     }
//     // compare the password
//     const comparePassword=await bcrypt.compare(req.body.password,createUser.pass)
//     if(!comparePassword){
//         return res.send({message:"Wrong password"})
//     }
//     const usertoken=jwt.sign({user:"dhdjjs"},"djhbcjfekjidhidcecere")
//     res.cookie('name',"hello",{httpOnly:true ,maxAge:36000000})
//     // res.cookie('jwt',usertoken,{httpOnly:true ,maxAge:3600000})
//     // console.log(res.cookie.jwt)

//     res.send({message:"User loggedIn" , token:usertoken,name:createUser.candidatename,email:createUser.email})
// })

// // forgotpassword
// app.post("/forgotpassword",async(req,res)=>{
//     let createUser=await citmodels.findOne({"email":req.body.email})
// // console.log(createUser.email)
//     if(!createUser){
//         return res.send({message:"User does not exist!"})
//     }

//     const otp = Math.floor(Math.random() * 10000)
//     createUser.updateOne({ "otp": otp }).then(resws =>{
//         // console.log("success otp saved")
//         res.send({message:"otp sent to email"})
//         }).catch(er =>{
//           console.log(er)
//         })
//         console.log("otp,",otp)

// // Create a transporter using your email
// let transporter = nodemailer.createTransport({
//   service: 'gmail',  // You can use other services like 'hotmail', 'yahoo', etc.
//   auth: {
//     user: 'uniquedevil21@gmail.com',  // Replace with your email
//     pass: 'pdjxbzqmpdijwhae',   // Replace with your email password or app password
//   },
// });

// // Set up email data ${createUser.email}
// let mailOptions = {
//   from: 'uniquedevil21@gmail.com',  // Sender address
//   to: createUser.email,   // List of recipients
//   subject: 'Reset password',  // Subject line
//   text: `otp is ${otp}`,  // Plain text body
//   // html: '<p>Hello, this is a test email sent using Nodemailer!</p>'  // If you prefer HTML format
// };
// // Send the email
// transporter.sendMail(mailOptions, (error, info) => {
//   if (error) {
//     return console.log('Error sending email:', error);
//   }
//   res.send({message:"otp sent to email"})
// });

// })

// // newpassword
// app.post("/newpassword", async(req,res)=>{
//     let newpassUser=await citmodels.findOne({"otp":req.body.otp})
//     if(!newpassUser){
//         res.send({message:"wrong otp"})
//     }
//     const hashnewpassword=await bcrypt.hash(req.body.newusepassword, 12)
//     citmodels.updateOne({"pass":hashnewpassword}).then(re =>{
//         res.send({message:"password changed successfully"})
//     })
// })

// // admin create user
// app.post("/admincreate",async (req,res)=>{
//     let createadmin=await admin.findOne({"adminemail":req.body.adminemail})
//     if(createadmin){
//         return res.send({message:"Email exists"})
//     }
//     // hash the password
//     const hashpassword=await bcrypt.hash(req.body.adminpassword , 12)
//     const user=admin({"adminname":req.body.adminname,"adminemail":req.body.adminemail,"adminpassword":hashpassword})
//     await user.save().then(ress =>{
//         res.send({message:"Admin Registered successfully"})
//     }).catch(err =>{
//         res.send({message:"Failed! try again"})
//     })
// })

// // Admin login user
// app.post("/adminlogin",async(req,res)=>{
//     let adminUser=await admin.findOne({"adminemail":req.body.adminemail})

//     if(!adminUser){
//         return res.send({message:"User not registered"})
//     }

//     // compare the password
//     const comparepass=await bcrypt.compare(req.body.adminpassword,adminUser.adminpassword)

//     if(!comparepass){
//         return res.send({message:"Wrong password"})
//     }

//     const usertoken=jwt.sign({user:"dhdjjs"},"djhbcjfekjidhidcecere")
//     res.send({message:"Admin LoggedIn",admintoken:usertoken,"AdminName":adminUser.adminname,"AdminEmail":adminUser.adminemail})
// })

// // create question
// app.post('/createquestion',async(req,res)=>{
//     const samequestion=await questionmodel.findOne({"question1":req.body.question1})
//     if(samequestion){
//         return res.send({message:"Question Existed !"})
//     }
//     const quest=new questionmodel(req.body)
//     await quest.save().then(resultsave =>{
//         res.send({message:"Question saved ..."})
//     }).catch(err=>{
//         res.status(403).send({message:"Error found ! "})
//     })
// })

// // delete question
// app.post('/deletequestion',async(req,res)=>{
//     const deletequestion=await questionmodel.findOneAndDelete({"question1":req.body.deletequestion})
//     res.send({message:"Deleted"})
// })

// // save answers
// app.post('/saveanswers',async(req,res)=>{
//     const answe=new answermodel(req.body)
//     const existedAnswer=await answermodel.findOne({"userEmail":req.body.userEmail})
//     if(existedAnswer){
//         return res.send({message:"Answer already saved !"})
//     }
//     await answe.save().then(result =>{
//         res.send({message:"Answer saved"})
//     }).catch(er=>{
//         res.status(403).send({message:"Error found !"})
//     })
// })

// // getandshowquestion
// app.get('/getandshowquestion',async(req,res)=>{
//     const allQuestions=await questionmodel.find({})
//     res.send(allQuestions)
// })

// // check user that test appeared or not
// app.post('/checkuser',async(req,res)=>{
//     const checkUser=await answermodel.findOne({"userEmail":req.body.userEmail})
//     if(checkUser){
//         return res.send({message:"User has appeared for test !"})
//     }
// })

// // cit user test result
//     app.post("/test",async (req,res)=>{
//         const loggeduser = await citResult.findOne({ "email":req.body.email})

//     const appearedUser=new citResult(req.body)
//     await appearedUser.save().then(response=>{
//         res.send({message:"Result saved !"})
//     }).catch(err =>{
//         res.send({message:err})
//     })
//     // console.log(req.body)
// //     console.log(appearedUser)
// // console.log(loggeduser)
// })

// // show users
// app.get("/userscore", async (req, res) => {
//   try {
//     const leaderboard = await answermodel.find({});

//     const correctAnswers = {
//       "1": "physics",
//       "3": "physical",
//       "4": "Africa",
//       "5": "Niece",
//       "6": "No"
//     };

//     const result = leaderboard.map(user => {
//       const answers = Array.isArray(user.answers) ? user.answers[0] : user.answers;
//       let marks = 0;

//       for (let key in correctAnswers) {
//         if (answers[key] && answers[key].toLowerCase() === correctAnswers[key].toLowerCase()) {
//           marks += 4;
//         }
//       }

//       return {
//         name: user.userName,
//         email: user.userEmail,
//         mark: marks
//       };
//     });

//     res.send(result);  // ✅ send the final array of scores once
//   } catch (error) {
//     console.error("Error calculating scores:", error);
//     res.status(500).send({ error: "Internal Server Error" });
//   }
// });

// app.listen(port,()=>{
//     console.log(`cit running on ${port}`)
// })

// }
