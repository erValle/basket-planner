# Scripts de Inicialización de Datos

Scripts opcionales para insertar datos iniciales de ejercicios y equipamiento en la base de datos.

## Requisitos Previos

- Base de datos creada y migraciones ejecutadas
- Al menos un club creado en la base de datos (para el equipamiento)

## Scripts Disponibles

### 1. Insertar Equipamiento (`seed-equipment.js`)

Inserta 13 items de equipamiento básico para baloncesto.

#### Uso Básico

```bash
# Desde el directorio backend
node scripts/seed-equipment.js
```

Este comando asignará el equipamiento al primer club disponible en la base de datos.

#### Opciones

```bash
# Asignar a un club específico
node scripts/seed-equipment.js --club-id=2

# Ver ayuda
node scripts/seed-equipment.js --help
```

#### Equipamiento Incluido

- Balones de baloncesto (30 unidades)
- Conos de entrenamiento (50 unidades)
- Canastas (6 unidades)
- Petos (20 unidades)
- Foam pads (10 unidades)
- Pizarra táctica (4 unidades)
- Cronómetros/Apps (5 unidades)
- Colchonetas (15 unidades)
- Bandas elásticas (20 unidades)
- Foam rollers (10 unidades)
- Cajones pliométricos (8 unidades)
- Tarjetas de colores (10 unidades)
- Silbatos/Apps (5 unidades)

**Características:**
- No inserta duplicados (verifica por nombre)
- Cada item incluye aliases para mapear con ejercicios
- Todos los items tienen status 'available'

### 2. Insertar Ejercicios (`seed-exercises.js`)

Inserta ejercicios de baloncesto desde un archivo JSON.

#### Uso Básico

```bash
# Insertar ejercicios (versión reducida - 29 ejercicios)
node scripts/seed-exercises.js

# Insertar ejercicios (versión completa - 102 ejercicios)
node scripts/seed-exercises.js --file=db_ejercicios.json

# Limpiar ejercicios existentes antes de insertar
node scripts/seed-exercises.js --clear

# Ver ayuda
node scripts/seed-exercises.js --help
```

#### Opciones

- `--file=NOMBRE_ARCHIVO`: Especifica el archivo JSON a usar
  - Por defecto: `db_ejercicios_reducido.json` (29 ejercicios)
  - Alternativa: `db_ejercicios.json` (102 ejercicios)
- `--clear`: Elimina todos los ejercicios existentes antes de insertar
- `--help`: Muestra la ayuda

#### Archivos de Ejercicios

**db_ejercicios_reducido.json (Recomendado - 29 ejercicios)**
- Lista curada con ejercicios esenciales
- Cubre todas las categorías principales
- Ideal para empezar rápido

**db_ejercicios.json (Completo - 102 ejercicios)**
- Biblioteca completa de ejercicios
- Mayor variedad y especialización
- Más opciones para el motor de recomendación

**Características:**
- No inserta duplicados (verifica por nombre)
- Mapea tipos específicos de baloncesto a enums de BD
- Preserva el tipo original en el campo `tags`
- Incluye materiales necesarios para filtrado

## Ejemplos de Uso

### Configuración Inicial Completa

```bash
cd backend

# 1. Insertar equipamiento
node scripts/seed-equipment.js

# 2. Insertar ejercicios (versión reducida)
node scripts/seed-exercises.js

# Verificar
echo "Equipamiento insertado:"
docker compose exec postgres psql -U postgres -d planificador_basket_db -c "SELECT name, quantity FROM equipment;"

echo "Ejercicios insertados:"
docker compose exec postgres psql -U postgres -d planificador_basket_db -c "SELECT COUNT(*) FROM exercises;"
```

### Actualizar Lista de Ejercicios

```bash
# Limpiar y reemplazar con versión completa
node scripts/seed-exercises.js --file=db_ejercicios.json --clear
```

### Configuración Multi-Club

```bash
# Insertar equipamiento para diferentes clubs
node scripts/seed-equipment.js --club-id=1
node scripts/seed-equipment.js --club-id=2
```

## Verificación

### Verificar Equipamiento

```bash
# Contar items
docker compose exec postgres psql -U postgres -d planificador_basket_db -c "SELECT COUNT(*) FROM equipment;"

# Ver detalles
docker compose exec postgres psql -U postgres -d planificador_basket_db -c "SELECT id, name, quantity, status FROM equipment;"
```

### Verificar Ejercicios

```bash
# Contar ejercicios
docker compose exec postgres psql -U postgres -d planificador_basket_db -c "SELECT COUNT(*) FROM exercises;"

# Ver por tipo
docker compose exec postgres psql -U postgres -d planificador_basket_db -c "SELECT type, COUNT(*) FROM exercises GROUP BY type;"

# Ver tipos originales
docker compose exec postgres psql -U postgres -d planificador_basket_db -c "SELECT tags->>'tipo_original' as tipo, COUNT(*) FROM exercises GROUP BY tipo ORDER BY COUNT(*) DESC;"
```

## Solución de Problemas

### Error: No hay clubs en la base de datos

Si al ejecutar `seed-equipment.js` aparece este error:

```
❌ Error: No hay clubs en la base de datos.
   Por favor, cree un club primero o especifique un --club-id
```

**Solución:** Cree un club primero usando la interfaz web o mediante SQL:

```sql
INSERT INTO clubs (name, "createdAt", "updatedAt") 
VALUES ('Mi Club', NOW(), NOW());
```

### Error: No se pudo cargar el archivo

Si al ejecutar `seed-exercises.js` aparece un error de archivo no encontrado:

```
❌ Error: No se pudo cargar el archivo "..."
```

**Solución:** Verifique que el archivo existe en la raíz del proyecto:
- `db_ejercicios_reducido.json`
- `db_ejercicios.json`

### Duplicados

Los scripts **no** insertan duplicados. Si un item ya existe (por nombre), lo saltará automáticamente:

```
⏭️  Saltando "Balón de baloncesto" (ya existe)
```

## Integración con Sistema de Filtrado

Una vez insertados los ejercicios y equipamiento, el sistema de filtrado automáticamente:

1. Detecta el equipamiento disponible
2. Filtra ejercicios según materiales necesarios
3. Solo genera planificaciones con ejercicios realizables

Ver `EQUIPMENT_FILTERING_SYSTEM.md` para más detalles sobre el sistema de filtrado.

## Notas Importantes

- ✅ Los scripts son **idempotentes**: pueden ejecutarse múltiples veces sin crear duplicados
- ✅ Son **opcionales**: no son necesarios para que la aplicación funcione
- ✅ Son **independientes**: no usan el sistema de seeders de Sequelize
- ✅ Incluyen **validación**: verifican que existan las dependencias necesarias (clubs, archivos)
- ✅ Proporcionan **feedback detallado**: muestran progreso y resumen de operaciones
