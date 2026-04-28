const mongoose = require("mongoose");
const bookSchema = new mongoose.Schema({
title: {
    type: String,
    required: [true, "Please add a book title"],
    trim: true,
    maxlength: [100, "Title cannot be more than 100 characters"]
},
author: {
    type: String,
    required: [true, "Please add an author"]
},
description: {
    type: String,
    required: [true, "Please add a description"]
},
isbn: {
    type: String,
    unique: true,
    sparse: true
},
genre:{
    type: String,
    enum: ["Fiction", "Non-Fiction", "Sci-Fi", "Mystery", "other"]
},
publishedDate: {
    type: Date
},
totalCopies: {
    type: Number,
    default: 1,
},
availableCopies: {
    type: Number,
    default: 1,
},
rating: {
    type: Number,
    min: 1,
    max: 5
},
createdAt: {
    type: Date,
    default: Date.now
},
image: {
  type: String,
  default: ""
},
status: {
  type: String,
  enum: ["Available", "Borrowed"],
  default: "Available"
},
borrowedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
}
});
module.exports = mongoose.model("Book", bookSchema);