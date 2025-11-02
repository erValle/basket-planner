var express = require('express');
var router = express.Router();

const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require('../src/controllers/userController');

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/',  createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
