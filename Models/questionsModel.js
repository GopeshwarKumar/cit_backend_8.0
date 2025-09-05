const mongoose=require("mongoose")

mongoose.connect(`${process.env.MODELS_MONGO_URL}/cit`)

let questionSchema=new mongoose.Schema({
    question1:{
        type:String,
    },
    option1:{
        type:String,
    },
    option2:{
        type:String,
    },
    option3:{
        type:String,
    },
    option4:{
        type:String,
    },
    questionImage:{
        type:String,
    },
    answer:{
        type:String,
    },
    createdAt: { type: Date, default: Date.now },

    
    
})

module.exports=mongoose.model("question",questionSchema)
// mongodb://127.0.0.1:27017