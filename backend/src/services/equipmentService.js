const { StatusCodes } = require('http-status-codes');

const { Equipment, Exercise } = require('../../models');
const errorUtils = require('../libs/errorHelper');

/**
 * Normaliza un nombre de material para comparación (sin acentos, minúsculas)
 * @param {string} material - Nombre del material
 * @returns {string} Material normalizado
 */
function normalizeMaterialName(material) {
  if (!material) return '';
  return material
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Eliminar acentos
}

/**
 * Verifica y reactiva ejercicios que ahora tienen material disponible
 * @param {string} materialName - Nombre del nuevo material disponible
 * @param {number} clubId - ID del club
 * @returns {Promise<number>} Número de ejercicios reactivados
 */
async function checkAndReactivateExercises(materialName, clubId) {
  try {
    // Obtener todos los materiales disponibles del club
    const allEquipment = await Equipment.findAll({
      where: { clubId, status: 'available' },
    });

    const availableMaterials = allEquipment.map((e) => normalizeMaterialName(e.name));

    // Obtener ejercicios inactivos del club
    const inactiveExercises = await Exercise.findAll({
      where: {
        clubId,
        active: false,
      },
    });

    let reactivated = 0;

    for (const exercise of inactiveExercises) {
      const characteristics = exercise.characteristics || {};
      const requiredMaterials = characteristics.requiredEquipment || [];

      if (requiredMaterials.length === 0) {
        // No requiere material específico, puede reactivarse
        await exercise.update({ active: true });
        reactivated++;
        continue;
      }

      // Verificar si ahora tiene todos los materiales
      const hasAllMaterials = requiredMaterials.every((required) => {
        const normalizedRequired = normalizeMaterialName(required);
        return availableMaterials.some(
          (available) =>
            available === normalizedRequired ||
            available.includes(normalizedRequired) ||
            normalizedRequired.includes(available)
        );
      });

      if (hasAllMaterials) {
        await exercise.update({ active: true });
        reactivated++;
      }
    }

    return reactivated;
  } catch (error) {
    console.error('Error checking exercises for reactivation:', error);
    return 0;
  }
}

const listEquipment = async ({ clubId, userClubIds } = {}) => {
  const where = {};

  // Si se especifica un clubId específico, usarlo
  if (clubId) {
    where.clubId = clubId;
  }
  // Si se especifican userClubIds (para filtrar por clubes del usuario), usarlos
  else if (userClubIds && userClubIds.length > 0) {
    const { Op } = require('sequelize');
    where.clubId = { [Op.in]: userClubIds };
  }

  return Equipment.findAll({ where });
};

const getEquipmentById = async (id) => {
  const item = await Equipment.findByPk(id);
  if (!item) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'EQUIPMENT_NOT_FOUND', 'Equipment not found');
  }
  return item;
};

const createEquipment = async (payload) => {
  const item = await Equipment.create(payload);

  // Si el material está disponible, verificar ejercicios que podrían reactivarse
  if (item.status === 'available' && item.clubId) {
    await checkAndReactivateExercises(item.name, item.clubId);
  }

  return item;
};

const updateEquipment = async (id, payload) => {
  const item = await getEquipmentById(id);
  const wasUnavailable = item.status !== 'available';

  await item.update(payload);

  // Si el material pasó a disponible, verificar ejercicios que podrían reactivarse
  if (wasUnavailable && item.status === 'available' && item.clubId) {
    await checkAndReactivateExercises(item.name, item.clubId);
  }

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
  checkAndReactivateExercises,
  normalizeMaterialName,
};
