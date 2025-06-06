const mongoose=require("mongoose")

mongoose.connect(`${process.env.MODELS_MONGO_URL}/cit`).then(res => {
    console.log('Connected to DB')
}).catch(err => {
    console.log('DB connection error: ');
});

let cituserSchema=new mongoose.Schema({
    adminname:{
        type:String,
    },
    adminemail:{
        type:String,
    },
    adminpassword:{
        type:String,
    },
    createdAt: { type: Date, default: Date.now },
    
})

module.exports=mongoose.model("Admin",cituserSchema)
// mongodb://127.0.0.1:27017