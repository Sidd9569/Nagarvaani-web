const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema({

    ticketId: String,

    issueType: String,

    description: String,

    latitude: Number,

    longitude: Number,

    locationName: String,

    image: String,

    priority: {
        type: String,
        enum: ["Low", "Medium", "High"]
    },

    status: {
        type: String,
        default: "Pending"
    },

    aiDetectedCategory: String,

    confidenceScore: Number,

    votes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],

    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("Issue", issueSchema);