const mongoose=require("mongoose")

mongoose.connect(`${process.env.MODELS_MONGO_URL}/cit`).then(res => {
    console.log('Connected to DB')
}).catch(err => {
    console.log('DB connection error: ');
});

let answerSchema=new mongoose.Schema({
    userName:{
        type: String,
    },
    userEmail:{
        type: String,
    },
    answers:{
        type: Object,
    },
    createdAt: { type: Date, default: Date.now },
    
})

module.exports=mongoose.model("answer",answerSchema)
// mongodb://127.0.0.1:27017