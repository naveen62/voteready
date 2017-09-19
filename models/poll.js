var mongoose = require("mongoose");

var pollSchema = new mongoose.Schema({
    poll: String,
    option: [
         {
             text: String,
             vote: Number
         }
        ],
    author: {
       id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    ips: [],
    comments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Comment"
            }
        ],
})

module.exports = mongoose.model("Poll", pollSchema);
