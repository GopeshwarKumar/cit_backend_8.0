const mongoose=require("mongoose");

const testSchema=new mongoose.Schema({
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
    createdAt: { type: Date, default: Date.now },
})

module.exports=mongoose.model("citUsersResult",testSchema)
// const testSch=mongoose.model("citUsersResult",testSchema)
// module.exports=testSch