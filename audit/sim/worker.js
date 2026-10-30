// A runner worker: plays the matches it is sent, one at a time, and sends each result back
const { runMatch } = require('./match');
process.on('message', ({ i, spec }) => {
  try { process.send({ i, res: runMatch(spec) }); } catch (e) { process.send({ i, error: e.stack || String(e) }); }
});
