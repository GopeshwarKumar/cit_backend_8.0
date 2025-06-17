const mongoose=require("mongoose")

mongoose.connect(`${process.env.MODELS_MONGO_URL}/cit`);

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
    createdAt: { type: Date, default: Date.now },
    
})

module.exports=mongoose.model("CitUser",cituserSchema)