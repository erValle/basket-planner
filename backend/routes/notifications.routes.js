const express = require('express');
const router = express.Router();

const { requireAuth } = require('../src/middlewares/rbac');

// Minimal in-memory implementation to support the frontend.
// Later: persist to DB + user scoping.
const state = {
  items: [],
};

function seedIfEmpty() {
  if (state.items.length) return;
  const now = Date.now();
  state.items = [
    {
      id: 'n-1',
      title: 'Sistema listo',
      message: 'Backend conectado correctamente.',
      createdAt: new Date(now - 1000 * 60 * 10).toISOString(),
      type: 'info',
      read: false,
    },
  ];
}

router.use(requireAuth);

router.get('/', (req, res) => {
  seedIfEmpty();
  res.json({ items: state.items });
});

router.post('/read-all', (req, res) => {
  seedIfEmpty();
  state.items = state.items.map((n) => ({ ...n, read: true }));
  res.json({ ok: true });
});

router.post('/:id/read', (req, res) => {
  seedIfEmpty();
  const id = req.params.id;
  state.items = state.items.map((n) => (n.id === id ? { ...n, read: true } : n));
  res.json({ ok: true });
});

module.exports = router;
