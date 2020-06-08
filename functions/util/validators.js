//Need to check that data is not empty

const isEmpty = (string) => {
  return string.trim() === "";
};

exports.checkSignupData = (data) => {
  const errors = {};
  let valid = true;

  let paswordsMatch = data.password === data.confirmPassword;

  if (!paswordsMatch) {
    errors.confirmPassword = "Passwords do not match";
    valid = false;
  }
  if (isEmpty(data.email)) {
    errors.email = "Email cannot be empty";
    valid = false;
  }
  if (isEmpty(data.password)) {
    errors.password = "Password cannot be empty";
    valid = false;
  }
  if (isEmpty(data.confirmPassword)) {
    errors.confirmPassword = "Confirm Password cannot be empty";
    valid = false;
  }
  if (isEmpty(data.handle)) {
    errors.handle = "Handle cannot be empty";
    valid = false;
  }

  return {
    errors: errors,
    valid: valid,
  };
};

exports.checkLoginData = (data) => {
  const errors = {};
  let valid = true;

  if (isEmpty(data.email)) {
    errors.email = "Email cannot be empty";
    valid = false;
  }
  if (isEmpty(data.password)) {
    errors.password = "Password cannot be empty";
    valid = false;
  }

  return {
    errors: errors,
    valid: valid,
  };
};
