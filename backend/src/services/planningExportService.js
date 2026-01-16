const PDFDocument = require('pdfkit');

const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

const flattenExercises = (planVersion) => {
  const sessions = Array.isArray(planVersion?.sessions) ? planVersion.sessions : [];

  const rows = [];
  for (const session of sessions) {
    const exercises = Array.isArray(session.exercises) ? session.exercises : [];
    if (exercises.length === 0) {
      rows.push({
        sessionId: session.sessionId || '',
        day: session.day || '',
        focusTags: Array.isArray(session.focusTags) ? session.focusTags.join('|') : '',
        exerciseId: '',
        exerciseName: '',
        exerciseType: '',
        durationMinutes: '',
        intensity: '',
        estimatedLoad: '',
      });
      continue;
    }

    for (const ex of exercises) {
      rows.push({
        sessionId: session.sessionId || '',
        day: session.day || '',
        focusTags: Array.isArray(session.focusTags) ? session.focusTags.join('|') : '',
        exerciseId: ex.id || '',
        exerciseName: ex.name || '',
        exerciseType: ex.type || '',
        durationMinutes: ex.durationMinutes ?? '',
        intensity: ex.intensity || '',
        estimatedLoad: ex.estimatedLoad ?? '',
      });
    }
  }

  return rows;
};

const exportToCSV = (planVersion, { title, author, planId } = {}) => {
  const meta = {
    planId: planId ?? planVersion?.trainingPlanId ?? '',
    versionId: planVersion?.id ?? '',
    versionNumber: planVersion?.versionNumber ?? '',
    source: planVersion?.source ?? '',
    date: planVersion?.date ? new Date(planVersion.date).toISOString() : '',
    author: author ?? '',
    title: title ?? '',
  };

  const headerLines = [
    `# title: ${meta.title}`,
    `# planId: ${meta.planId}`,
    `# versionNumber: ${meta.versionNumber}`,
    `# versionId: ${meta.versionId}`,
    `# source: ${meta.source}`,
    `# date: ${meta.date}`,
    `# author: ${meta.author}`,
    '',
  ];

  const columns = [
    'sessionId',
    'day',
    'focusTags',
    'exerciseId',
    'exerciseName',
    'exerciseType',
    'durationMinutes',
    'intensity',
    'estimatedLoad',
  ];

  const rows = flattenExercises(planVersion);
  const csvLines = [columns.join(',')];

  for (const row of rows) {
    csvLines.push(columns.map((c) => escapeCsvValue(row[c])).join(','));
  }

  return `${headerLines.join('\n')}${csvLines.join('\n')}\n`;
};

const exportToPDF = async (planVersion, { title, author, planId } = {}) => {
  const meta = {
    planId: planId ?? planVersion?.trainingPlanId ?? '',
    versionId: planVersion?.id ?? '',
    versionNumber: planVersion?.versionNumber ?? '',
    source: planVersion?.source ?? '',
    date: planVersion?.date ? new Date(planVersion.date).toLocaleString() : '',
    author: author ?? '',
    title: title ?? 'Training Plan',
  };

  const doc = new PDFDocument({ margin: 50 });
  const buffers = [];
  doc.on('data', (b) => buffers.push(b));

  const endPromise = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
  });

  doc.fontSize(18).text(meta.title, { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10);
  doc.text(`Plan ID: ${meta.planId}`);
  doc.text(`Version: ${meta.versionNumber} (id: ${meta.versionId})`);
  doc.text(`Source: ${meta.source}`);
  doc.text(`Date: ${meta.date}`);
  if (meta.author) doc.text(`Author: ${meta.author}`);

  doc.moveDown();
  doc.fontSize(14).text('Sessions', { underline: true });
  doc.moveDown(0.5);

  const sessions = Array.isArray(planVersion?.sessions) ? planVersion.sessions : [];

  doc.fontSize(11);
  if (sessions.length === 0) {
    doc.text('No sessions found.');
  } else {
    sessions.forEach((s, idx) => {
      doc.fontSize(12).text(`${idx + 1}. ${s.day || ''} — ${s.sessionId || ''}`);
      const focus = Array.isArray(s.focusTags) ? s.focusTags.join(', ') : '';
      if (focus) {
        doc.fontSize(10).fillColor('gray').text(`Focus: ${focus}`).fillColor('black');
      }

      const exercises = Array.isArray(s.exercises) ? s.exercises : [];
      if (exercises.length === 0) {
        doc.fontSize(10).text('  (no exercises)');
      } else {
        exercises.forEach((ex) => {
          doc.fontSize(10).text(
            `  - ${ex.name || ex.id || 'Exercise'} | ${ex.type || ''} | ${ex.durationMinutes ?? ''} min | ${ex.intensity || ''} | load ${ex.estimatedLoad ?? ''}`
          );
        });
      }

      doc.moveDown(0.5);
    });
  }

  doc.end();
  return endPromise;
};

module.exports = {
  exportToCSV,
  exportToPDF,
};
