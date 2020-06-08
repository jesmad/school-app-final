const { admin, db } = require("../util/admin.js");

//Install this module in the /functions directory by issuing the command 'npm install --save firebase'
const firebase = require("firebase");

const config = require("../util/config.js");

//VALIDATORS
const { checkSignupData, checkLoginData } = require("../util/validators.js");

firebase.initializeApp(config);

exports.signUp = (request, response) => {
  const newUser = {
    email: request.body.email,
    password: request.body.password,
    confirmPassword: request.body.confirmPassword,
    handle: request.body.handle,
  };

  const { errors, valid } = checkSignupData(newUser);
  if (!valid) return response.status(500).json(errors);

  let userID; //User's unique ID
  let userToken; //JSON Web Token (JWT) used to identify the user to a Firebase service

  //Check if the new user exists in the "users" collection by comparing the user handle with the existing ones
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return response.status(400).json({
          handle: "User already exists in the database",
        });
      } else {
        //On successful creation of the user account, the user will also be signed in
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password); //Returns a Promise< UserCredential >
      }
    })
    .then((authUser) => {
      /*Firebase creates a corresponding ID token that uniquely identifies them and grants them 
      access to several resources, such as Firebase Realtime Database and Cloud Storage
      */
      userID = authUser.user.uid;
      userToken = authUser.user.getIdToken(); //returns a Promise < String >
      return userToken;
    })
    .then((token) => {
      const newUserDoc = {
        email: newUser.email,
        handle: newUser.handle,
        userID: userID,
        startDate: new Date().toISOString(),
        imageURL: "NONE YET",
      };

      db.doc(`/users/${newUser.handle}`).set(newUserDoc);
      return response.status(200).json({ token: token });
      /*
      return response.status(200).json({
        message: `User -> ${newUser.handle} with ID -> ${userID} added successfully`,
        token: userToken,
      });
      */
    })
    .catch((err) => {
      console.error(err);
      console.log("BIG ERROR BECAUSE OF THE EMAIL");
      if (err.code === "auth/email-already-in-use") {
        return response.status(400).json({ email: "Email is already is use" });
      } else {
        return response
          .status(500)
          .json({ general: "Something went wrong, please try again" });
      }
      /*
    .catch((error) => {
      return response.status(500).json({
        general: "INCORRECT STUFF",
      });
      
      if (error.code == "auth/weak-password") {
        return response.json({
          message: "Error: Password is weak",
        });
      } else if (error.code == "auth/email-already-in-use") {
        return response.json({
          message: "Error: Email already in use",
        });
      } else if (error.code == "auth/invalid-email") {
        return response.json({
          message: "Error: Not a valid email address",
        });
      } else if (error.code == "auth/operation-not-allowed") {
        return response.json({
          message: "Error: Email/Password accounts have not been enabled",
        });
      }
      */
    });
};

exports.logIn = (request, response) => {
  const user = {
    email: request.body.email,
    password: request.body.password,
  };

  //Validate the user data (i.e. no empty inputs and valid email string)
  const { errors, valid } = checkLoginData(user);
  if (!valid) return response.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then((authUser) => {
      return authUser.user.getIdToken();
    })
    .then((token) => {
      return response.status(200).json({
        message: `User with email -> ${user.email} signed in successfully`,
        token: token,
      });
    })
    .catch((error) => {
      return response.status(500).json({
        general: "Incorrect email and/or password",
      });
    });
};

exports.getUserData = (request, response) => {
  //We need to get the current user from the request object
  let userData = {};
  let currentUserHandle = request.user.handle;
  db.doc(`/users/${currentUserHandle}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return response.status(500).json({
          message: `${currentUserHandle} does not exist`,
        });
      }
      userData.profile = doc.data();
      return response.json(userData);
    });
};

exports.uploadUserData = (request, response) => {
  //Uploading user info would occur after the user successfully makes an account

  db.collection("users")
    .doc(request.user.handle)
    .update({
      major: request.body.major,
      year: request.body.year,
      info: request.body.info,
    })
    .then(() => {
      return response.status(200).json({
        message: "Details added successfully",
      });
    })
    .catch((error) => {
      return response.status(500).json({
        error: error.code,
      });
    });
};
