const mongoose=require("mongoose");

// mongoose.connect(process.env.MODELS_MONGO_URL).then(() => {
//     console.log('Connected to DB');
// }).catch(err => {
//     console.log('DB connection error: ', err);
// });

// "mongodb+srv://gopeshwarkumark:gopeshwar23ce8004@cluster0.pecwn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/RN"
mongoose.connect(process.env.MODELS_MONGO_URL).then(() => {
  console.log('Connected to DB');
}).catch((e) => {
  console.log(e);
})

let cituserSchema=new mongoose.Schema({
    candidatename:{
        type:String,
    },
    email:{
        type:String,
    },
    pass:{
        type:String,
    },
    Answer1:{
        type:String,
    },
    Answer2:{
        type:String,
    },
    Answer3:{
        type:String,
    },
    Answer4:{
        type:String,
    },
    Answer5:{
        type:String,
    },
    Answer6:{
        type:String,
    },
    Answer7:{
        type:String,
    },
    Answer8:{
        type:String,
    },
    otp:{
        type:String,
    },
    testemail:{
        type:String,
    },
    finalScore:{
        type:String,
    },
    createdAt: { type: Date, default: Date.now },
    
})

module.exports=mongoose.model("CitUser",cituserSchema)
// mongodb://127.0.0.1:27017
