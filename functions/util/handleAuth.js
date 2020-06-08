const { admin, db } = require("./admin.js");

/*
    Authentication Middleware: Ensures that an authorized user is allowed to access the database
*/
module.exports = (request, response, next) => {
  if (
    request.headers.authorization &&
    request.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    let token = request.headers.authorization.split(" ")[1];

    admin
      .auth()
      .verifyIdToken(token) //Returns Promise < DecodedIdToken >
      .then(decodedToken => {
        //Add a user property to the request object that holds the token's decoded claims
        request.user = decodedToken;

        //Search "users" collection for the user that matches the user ID
        return db
          .collection("users")
          .where("userID", "==", request.user.uid)
          .limit(1)
          .get();
      })
      .then(data => {
        //Add the user info to the request.user object (this will be used to ensure that no unauthorized actions are made by unauthorized
        //users)
        request.user.handle = data.docs[0].data().handle;
        request.user.imageURL = data.docs[0].data().imageURL;
        return next();
      })
      .catch(error => {
        alert("Error: Unauthorized action");
        response.status(500).json({
          error: error.code
        });
      });
  }
};
