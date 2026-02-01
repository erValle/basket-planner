const express = require('express');
const router = express.Router();
const validate = require('../src/middlewares/validate');
const { requireAuth, requireAnyRole } = require('../src/middlewares/rbac');
const { createEquipmentSchema, updateEquipmentSchema } = require('../src/validation/equipmentSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const { listEquipment, getEquipment, createEquipment, updateEquipment, deleteEquipment } = require('../src/controllers/equipmentController');

router.use(requireAuth);

// ==================== /equipment ====================
// GET  /equipment - CU.020: Todos pueden listar material
router.get('/', listEquipment);
// POST /equipment - CU.020: Registro de material - admin, technical_director (su club), coach (su club)
router.post('/', requireAnyRole('admin', 'technical_director', 'coach'), validate({ body: createEquipmentSchema }), createEquipment);

// ==================== /equipment/:id ====================
// GET    /equipment/:id - CU.020: Ver material
router.get('/:id', validate({ params: idParamSchema }), getEquipment);
// PUT    /equipment/:id - CU.021: Edición de material - admin, technical_director (su club), coach (su club)
router.put('/:id', requireAnyRole('admin', 'technical_director', 'coach'), validate({ params: idParamSchema, body: updateEquipmentSchema }), updateEquipment);
// DELETE /equipment/:id - CU.022: Eliminación de material - solo admin (recomendación por control)
router.delete('/:id', requireAnyRole('admin'), validate({ params: idParamSchema }), deleteEquipment);

module.exports = router;
