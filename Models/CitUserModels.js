const mongoose=require("mongoose");

mongoose.connect(process.env.MODELS_MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to DB');
}).catch(err => {
    console.log('DB connection error: ', err);
});

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