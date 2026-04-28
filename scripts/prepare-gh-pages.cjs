const fs = require('fs-extra');
const path = require('path');

module.exports = async function prepareGhPages(git) {
  const root = git.cwd;
  const entries = await fs.readdir(root);

  for (const entry of entries) {
    if (!entry.startsWith('.')) {
      continue;
    }
    if (entry === '.git' || entry === '.nojekyll') {
      continue;
    }

    await fs.remove(path.join(root, entry));
  }
};
