const { StatusCodes } = require('http-status-codes');

const { Equipment } = require('../../models');
const errorUtils = require('../libs/errorHelper');

const listEquipment = async ({ clubId } = {}) => {
  const where = {};
  if (clubId) where.clubId = clubId;
  return Equipment.findAll({ where });
};

const getEquipmentById = async (id) => {
  const item = await Equipment.findByPk(id);
  if (!item) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'EQUIPMENT_NOT_FOUND', 'Equipment not found');
  }
  return item;
};

const createEquipment = async (payload) => Equipment.create(payload);

const updateEquipment = async (id, payload) => {
  const item = await getEquipmentById(id);
  await item.update(payload);
  return item;
};

const deleteEquipment = async (id) => {
  const item = await getEquipmentById(id);
  await item.destroy();
};

module.exports = {
  listEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
};
