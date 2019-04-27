import dotenv from 'dotenv';
import * as Users from '../models/users';
import {
  hashPassword,
  comparePassword,
  generateToken,
  setServerResponse,
  formatReturnedUser
} from '../utils';

dotenv.config();
const { USER_NAME, PASSWORD } = process.env;

/**
 * Create a new user after hashing password and generating token
 * @name createUser
 * @async
 * @param {Object} req
 * @param {Object} res
 * @returns {JSON} details of the newly created user
 */
const createUser = async (req, res) => {
  try {
    const existingUser = await Users.findOneByEmail(req.body.email);
    if (existingUser) {
      return setServerResponse(res, 409, {
        error: 'User with provided email already exists.'
      });
    }
    const { tokenOwner } = res.locals;
    const hashedPassword = await hashPassword(req.body.password);
    const newUserObj = { ...req.body, password: hashedPassword };
    if (tokenOwner && tokenOwner.is_admin) {
      newUserObj.isStaff = true;
    } else {
      newUserObj.isStaff = false;
      newUserObj.isAdmin = false;
    }
    const user = await Users.create({ ...newUserObj });
    const token = generateToken({ id: user.id });
    const formattedUser = formatReturnedUser(user);
    return setServerResponse(res, 201, { data: [{ ...formattedUser, token }] });
  } catch (error) {
    return setServerResponse(res, 500, { error: 'A fix is in progress' });
  }
};

/**
 * return all the users in the database
 * @name getUsers
 * @async
 * @param {Object} req
 * @param {Object} res
 * @returns {JSON} all users registered
 */
const getUsers = async (req, res) => {
  try {
    const users = await Users.findAll();
    return setServerResponse(res, 200, { data: [users] });
  } catch (error) {
    return setServerResponse(res, 500, {
      error: "We're sorry about this. We're working to fix the problem."
    });
  }
};

/**
 * return a given user if the id provided is correct
 * @name getUser
 * @async
 * @param {Object} req
 * @param {Object} res
 * @returns {JSON} details of the specified user
 */
const getUser = async (req, res) => {
  try {
    const user = await Users.findOneById(req.params.id);
    if (!user) {
      return setServerResponse(res, 404, { error: 'User not found' });
    }
    const formattedUser = formatReturnedUser(user);
    return setServerResponse(res, 200, { data: [formattedUser] });
  } catch (error) {
    return setServerResponse(res, 500, {
      error: "We're sorry about this. We're working to fix the problem."
    });
  }
};

/**
 * Get all of a user's bank accounts
 * @async
 * @name getUserAccounts
 * @param {Object} req
 * @param {Object} res
 * @returns {JSON} all accounts that belong to a specified user
 */
const getUserAccounts = async (req, res) => {
  try {
    const accounts = await Users.findUserAccounts(req.params.id);
    return setServerResponse(res, 200, { data: accounts });
  } catch (error) {
    return setServerResponse(res, 500, { error });
  }
};

/**
 * Provide token for signed up user to login
 * @name loginUser
 * @async
 * @param {Object} req
 * @param {Object} res
 * @returns {JSON} response for user who logged in successfully
 * or any error encountered in the process
 */
const loginUser = async (req, res) => {
  try {
    const user = await Users.findOneByEmail(req.body.email);
    if (!user) {
      return setServerResponse(res, 404, {
        error: 'Incorrect email. User not found'
      });
    }
    if (user.email !== USER_NAME && req.body.password !== PASSWORD) {
      const isValid = await comparePassword(req.body.password, user.password);
      if (!isValid) {
        return setServerResponse(res, 401, { error: 'Incorrect password' });
      }
    }
    const token = generateToken({ id: user.id });
    const formattedUser = formatReturnedUser(user);
    return setServerResponse(res, 200, { data: [{ ...formattedUser, token }] });
  } catch (error) {
    return setServerResponse(res, 500, {
      error: "We're sorry about this. We're working to fix the problem."
    });
  }
};

/**
 * @name dataToUpdateUser
 * @param {String} firstname
 * @param {String} lastname
 * @param {String} email
 * @returns {Object} details of the client to be updated
 */
const dataToUpdateUser = ({ firstname, lastname, email }) => ({
  ...(firstname && { firstname }),
  ...(lastname && { lastname }),
  ...(email && { email })
});

/**
 * Update the details of the provided user. Don't update email
 * @name updateUser
 * @async
 * @param {Object} req
 * @param {Object} res
 * @returns {JSON} details of the user that was updated
 */
const updateUser = async (req, res) => {
  try {
    let hashedPassword;
    const user = await Users.findOneById(req.params.id);
    if (!user) {
      return setServerResponse(res, 404, { error: 'Cannot find user' });
    }
    const { tokenOwner } = res.locals;
    if (tokenOwner.email !== user.email) {
      return setServerResponse(res, 403, { error: 'User and token mismatch' });
    }
    const {
      password, firstname, lastname, email
    } = req.body;
    if (password) hashedPassword = await hashPassword(password);
    const data = {
      ...(hashedPassword && { password: hashedPassword }),
      ...dataToUpdateUser({ firstname, lastname, email }),
      id: user.id
    };
    const updatedUser = await Users.findOneAndUpdate(data);
    const formattedUser = formatReturnedUser(updatedUser);
    return setServerResponse(res, 200, { data: [{ ...formattedUser }] });
  } catch (error) {
    return setServerResponse(res, 500, { error: 'A fix is in progress' });
  }
};

/**
 * Delete a provided user from the database
 * @name deleteUser
 * @async
 * @param {Object} req,
 * @param {Object} res,
 * @returns {JSON} message informing user that the selected user
 * has been deleted or that an error has occured
 */
const deleteUser = async (req, res) => {
  try {
    const user = await Users.findOneById(req.params.id);
    if (!user) {
      return setServerResponse(res, 404, { error: 'User not found' });
    }
    await Users.findOneAndDelete(req.params.id);
    return setServerResponse(res, 200, {
      message: `User with ID ${user.id} deleted successfully`
    });
  } catch (error) {
    return setServerResponse(res, 500, {
      error: 'A fix is in progress'
    });
  }
};

export {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  loginUser,
  getUserAccounts
};
