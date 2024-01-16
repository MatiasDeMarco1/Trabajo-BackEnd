const {Schema, model} = require('mongoose');
const mongoosePaginate = require("mongoose-paginate-v2")

const usersCollection = "users"

const usersSchema = Schema({
    first_name: {
        type: String,
        index: true,
        required: true
    },
    email: {
        type: String,
        index: true,
        required: true
    },
    password:{
        type: String
    },
    role:{
        type: String,
        default: "user"
    },
    gender: String
});

usersSchema.plugin(mongoosePaginate)

const usersModel = model(usersCollection, usersSchema)

module.exports = usersModel;