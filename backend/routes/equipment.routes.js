const express = require('express');
const router = express.Router();
const validate = require('../src/middlewares/validate');
const { requireAuth, requireAnyRole } = require('../src/middlewares/rbac');
const {
  createEquipmentSchema,
  updateEquipmentSchema,
} = require('../src/validation/equipmentSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const {
  listEquipment,
  getEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
} = require('../src/controllers/equipmentController');

router.use(requireAuth);

// GET  /equipment - Todos autenticados pueden listar material
router.get('/', listEquipment);
// POST /equipment - Solo Director Técnico puede registrar material de su club
router.post(
  '/',
  requireAnyRole('technical_director'),
  validate({ body: createEquipmentSchema }),
  createEquipment
);

// GET    /equipment/:id - Ver material (todos autenticados)
router.get('/:id', validate({ params: idParamSchema }), getEquipment);
// PUT    /equipment/:id - Solo Director Técnico puede editar material de su club
router.put(
  '/:id',
  requireAnyRole('technical_director'),
  validate({ params: idParamSchema, body: updateEquipmentSchema }),
  updateEquipment
);
// DELETE /equipment/:id - Solo Director Técnico puede eliminar material de su club
router.delete(
  '/:id',
  requireAnyRole('technical_director'),
  validate({ params: idParamSchema }),
  deleteEquipment
);

module.exports = router;
