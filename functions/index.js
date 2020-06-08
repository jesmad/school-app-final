const functions = require("firebase-functions");
var express = require("express");
var cors = require("cors");
var app = express();

app.use(cors());

const handleAuth = require("./util/handleAuth.js");
const {
  getSubjectPosts,
  getAllPosts,
  addPost,
  deletePost,
  likePost,
  unlikePost,
  commentPost,
  getOnePost,
  getComments,
} = require("./handlers/schoolPosts.js");

const {
  signUp,
  logIn,
  getUserData,
  uploadUserData,
} = require("./handlers/users.js");

//Post-Related Routes
app.get("/posts", getAllPosts);
app.get("/posts/:subject", getSubjectPosts);
app.get("/psts/:postID", getOnePost); //TODO: Figure out why this route fails when the pathname is "/posts/:postID" <-- returns [] with status code 200
app.post("/addPost", handleAuth, addPost);
app.delete("/posts/:postID", handleAuth, deletePost);
app.get("/posts/:postID/like", handleAuth, likePost);
app.get("/posts/:postID/unlike", handleAuth, unlikePost);
app.post("/posts/:postID/comment", handleAuth, commentPost);
app.get("/posts/:postID/comments", getComments);

//User Related Routes
app.post("/signup", signUp);
app.post("/login", logIn);
app.get("/user", handleAuth, getUserData);
app.post("/user", handleAuth, uploadUserData);

//Firebase Cloud Functions
exports.api = functions.https.onRequest(app); //Handles HTTP events
