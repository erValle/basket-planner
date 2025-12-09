const express = require('express');
const router = express.Router();
const validate = require('../src/middlewares/validate');
const { authenticateToken, authorizeRoles } = require('../src/middlewares/auth');
const { createEquipmentSchema, updateEquipmentSchema } = require('../src/validation/equipmentSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const { listEquipment, getEquipment, createEquipment, updateEquipment, deleteEquipment } = require('../src/controllers/equipmentController');

router.use(authenticateToken);

router.get('/', listEquipment);
router.get('/:id', validate({ params: idParamSchema }), getEquipment);
router.post('/', authorizeRoles('admin','technical_director','coach'), validate({ body: createEquipmentSchema }), createEquipment);
router.put('/:id', authorizeRoles('admin','technical_director','coach'), validate({ params: idParamSchema, body: updateEquipmentSchema }), updateEquipment);
router.delete('/:id', authorizeRoles('admin','technical_director'), validate({ params: idParamSchema }), deleteEquipment);

module.exports = router;
