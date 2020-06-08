const { db } = require("../util/admin.js");

//These Firebase functions are HTTP endpoints.

//GET ALL POSTS FROM A PARTICULAR SUBJECT
exports.getSubjectPosts = (request, response) => {
  let subjectPosts = [];
  db.collection("posts")
    .where("subject", "==", request.params.subject)
    .get()
    .then((snapshot) => {
      snapshot.forEach((doc) => {
        subjectPosts.push({
          postID: doc.id,
          subject: doc.data().subject,
          title: doc.data().title,
          body: doc.data().body,
          publishDate: doc.data().publishDate,
          user: doc.data().user,
          userImage: doc.data().userImage,
          numberLikes: doc.data().numberLikes,
          numberComments: doc.data().numberComments,
        });
      });
      response.status(200).json(subjectPosts);
    })
    .catch((error) => {
      alert(`Encountered a problem with /getSubjectPosts route: ${error}`);
    });
};

//GET ALL POSTS
exports.getAllPosts = (request, response) => {
  // return => [ {post...}, {post...}, ...]

  let posts = [];
  db.collection("posts")
    //.where("subject", "==", "ICS")  //<----------- This is where I can filter out the subject that I want to pull
    .get()
    .then((snapshot) => {
      snapshot.forEach((doc) => {
        posts.push({
          postID: doc.id,
          subject: doc.data().subject,
          title: doc.data().title,
          body: doc.data().body,
          publishDate: doc.data().publishDate,
          user: doc.data().user,
          userImage: doc.data().userImage,
          numberLikes: doc.data().numberLikes,
          numberComments: doc.data().numberComments,
        });
      });
      response.status(200).json(posts);
    })
    .catch((error) => {
      console.error(error);
      alert(`Unable to retrieve posts: {${error}}`);
    });
};

//GET ONE POST
exports.getOnePost = (request, response) => {
  // return = {doc : document, ...}
  let singlePost = {};
  let docID = request.params.postID;

  let docRef = db
    .doc(`/posts/${docID}`)
    .get()
    .then((document) => {
      if (!document.exists) {
        response.json({
          message: "Document does not exist",
        });
      } else {
        singlePost.doc = document.data();
        response.json({
          singlePost,
        });
      }
    })
    .catch((error) => {
      alert(`Failed to retrieve a single post: ${error}`);
      response.status(500).json({
        message: "/singlePost route failed",
      });
    });
};

//ADD A POST
exports.addPost = (request, response) => {
  //Add a post to the database with a Firecloud-generated ID
  let newDoc = {
    body: request.body.body,
    numberComments: 0,
    numberLikes: 0,
    publishDate: new Date().toISOString(),
    subject: request.body.subject, //<------ TODO: Will need to somehow get the subject by checking which page the user is in
    title: request.body.title,
    user: request.user.handle,
    userImage: request.user.imageURL,
  };

  //TODO: Handle invalid input (i.e. empty strings, incorrect info., etc.)

  db.collection("posts")
    .add(newDoc)
    .then((newDocReference) => {
      console.log(`Added document with ID ${newDocReference.id} successfully`);
      /*
      response.status(200).json({
        newDoc: newDoc,
        docID: newDocReference.id,
      });
      */
      newDoc.postID = newDocReference.id;
      return response.status(200).json(newDoc);
    })
    .catch((error) => {
      alert(
        `An error occurred when trying to add a post to the collection: ${error}`
      );
      return response.status(500).json({
        message: "Error when adding a post to the database",
      });
    });
};

// DELETE A POST
exports.deletePost = (request, response) => {
  let docToDeleteID = request.params.postID;
  let document = db.doc(`/posts/${docToDeleteID}`);

  document
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return response.json({
          message: "Document does not exist",
        });
      } else {
        if (doc.data().user !== request.user.handle) {
          return response.status(500).json({
            error: "Error: Unauthorized to delete post",
          });
        }
        return document.delete();
      }
    })
    .then(() => {
      response.status(200).json({
        message: "Document deleted successfully",
      });
    })
    .catch((error) => {
      alert(`Something went wrong in the delete route: ${error}`);
      response.status(500).json({
        message: error.code,
      });
    });
};

// LIKE A POST
exports.likePost = (request, response) => {
  let documentData;

  let likeDocRef = db
    .collection("likes")
    .where("handle", "==", request.user.handle)
    .where("postID", "==", request.params.postID)
    .limit(1);

  //Get the document from the database by using the post ID
  let docRef = db.collection("posts").doc(`${request.params.postID}`);

  //doc.numberLikes should be incremented only if this "like" does not already exist in the "likes" collection
  //That is, make sure that a post is not liked more than once by the someone who has already liked the post
  let getDoc = docRef
    .get()
    .then((doc) => {
      if (doc.exists) {
        documentData = doc.data();
        return likeDocRef.get(); // <= returns Firebase.QuerySnapshot, which is a collection of Firebase.DocumentSnapshot
      } else {
        return response.json({
          message: "Document does not exist",
        });
      }
    })
    .then((data) => {
      //data is a firebase.firestore.QuerySnapshot
      if (data.empty) {
        //likeDocRef does not exist. Add new document to the "likes" collection
        let newDoc = {
          handle: request.user.handle,
          postID: request.params.postID,
        };

        //Add document using a Cloud Firestore generated ID (i.e. .collection().add() instead of .doc().set(); IDENTICAL)
        return db
          .collection("likes")
          .add(newDoc)
          .then(() => {
            documentData.numberLikes++;
            return docRef.update({
              numberLikes: documentData.numberLikes,
            });
          })
          .then(() => {
            return response.json(documentData);
          });
      } else {
        //User has already liked post
        return response.json({
          message: "Error: Post already liked",
        });
      }
    })
    .catch((error) => {
      response.json({
        message: error.code,
      });
    });
};

// DISLIKE A POST
exports.unlikePost = (request, response) => {
  /*      Make sure that only logged in users are allowed to dislike a post (x)
          Make sure that a post is only disliked once per user 
          Make sure when decremtning the numberLikes property of a "posts" document, that we stop at 0.
          Make sure to delete the equivalent "likes" document when disliking a post
          Make sure that a user cannot dislike a post that hasn't been liked
          */

  let documentData;

  let likeRef = db
    .collection("likes")
    .where("postID", "==", request.params.postID)
    .where("handle", "==", request.user.handle)
    .limit(1);

  //Get DocumentReference of the post that will be disliked from the database
  let docRef = db.collection("posts").doc(`${request.params.postID}`);
  let document = docRef
    .get()
    .then((docSnapshot) => {
      //DocumentSnapshot contains data read from a document from the Firebase database
      if (docSnapshot.exists) {
        documentData = docSnapshot.data();
        return likeRef.get();
      } else {
        return response.status(500).json({
          message: "Document does not exist",
        });
      }
    })
    .then((querySnapshot) => {
      //QuerySnapshot contains 0 or more DocumentSnapshot objects representing the results of the query
      //The documents can be accessed as an array via the docs property or enumerated using the forEach method
      if (querySnapshot.empty) {
        //Post hasn't been liked.
        return response.status.json({
          error: "Invalid Action: Cannot unlike a post that hasn't been liked",
        });
      } else {
        //Delete the document from the "likes" collection
        return db
          .doc(`/likes/${querySnapshot.docs[0].id}`)
          .delete()
          .then(() => {
            //Decrement the numberLikes property of the unliked post
            documentData.numberLikes--;
            return docRef.update({
              numberLikes: documentData.numberLikes,
            });
          })
          .then(() => {
            return response.json({
              data: documentData,
            });
          });
      }
    })
    .catch((error) => {
      response.json({
        message: "Error when disliking a post",
        error: error.code,
      });
    });
};

// COMMENT ON A POST
exports.commentPost = (request, response) => {
  /*TODO:   ensure that the document exists in the database (x)
            ensure that only authorized users are making comments (x)
            author of a post can comment on its own post (x)
            add comment to a "comments" collection    
            also create "comments" collection (x)
  */
  let comment = {
    //userImage : request.user.userImage,
    handle: request.user.handle,
    body: request.body.body,
    publishDate: new Date().toISOString(),
    parentID: request.params.postID,
  };

  let parentData;
  let newCommentID;

  let parentDocRef = db.doc(`/posts/${request.params.postID}`);
  let document = parentDocRef
    .get() // Returns Promise< Firebase.DocumentSnapshot >
    .then((documentSnapshot) => {
      if (!documentSnapshot.exists) {
        return response.json({
          error: "Error: Document does not exist",
        });
      } else {
        //Add the comment to the "comments" collection.
        //Increment the numberComments property of this post
        parentData = documentSnapshot.data();
        return db
          .collection("comments")
          .add(comment)
          .then((docRef) => {
            parentData.numberComments++;
            newCommentID = docRef.id;

            return parentDocRef.update({
              numberComments: parentData.numberComments,
            });
          });
      }
    })
    .then(() => {
      return response.status(200).json({
        docID: newCommentID,
        data: comment,
      });
      /*
      return response.status(200).json({
        message: `Added document with ID: ${newCommentID}`,
      });
      */
    })
    .catch((error) => {
      return response.json({
        error: "Error when trying to make a comment",
      });
    });
};

exports.getComments = (request, response) => {
  const comments = [];
  db.collection("comments")
    .where("parentID", "==", request.params.postID)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        return response.status(200).json({
          comments: comments,
        });
      }
      snapshot.forEach((doc) => {
        comments.push({
          docID: doc.id,
          data: doc.data(),
        });
      });

      return response.status(200).json({
        comments: comments,
      });
    })
    .catch((err) => {
      return response.status(500).json({
        message: err,
      });
    });
};
