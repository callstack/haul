import path from 'path';

const fs = jest.genMockFromModule('fs');

let mockFiles = {};

function __setMockFiles(newMockFiles) {
  Object.entries(newMockFiles).forEach(([filePath, file]) => {
    const dir = path.dirname(filePath);
    if (!mockFiles[dir]) mockFiles[dir] = {};
    mockFiles[dir][path.basename(filePath)] = file;
  });
}

function __reset() {
  mockFiles = {};
}

function readdirSync(directoryPath) {
  return Object.keys(mockFiles[directoryPath] || {});
}

function readFileSync(filename) {
  const dir = path.dirname(filename);
  const basename = path.basename(filename);
  return mockFiles[dir][basename];
}

function lstatSync(directoryPath = '') {
  if (Object.keys(mockFiles[directoryPath] || {}).length)
    return { isDirectory: () => true, isFile: () => false };
  return { isDirectory: () => false, isFile: () => true };
}

fs.__setMockFiles = __setMockFiles;
fs.__reset = __reset;
fs.lstatSync = lstatSync;
fs.readdirSync = readdirSync;
fs.readFileSync = readFileSync;

module.exports = fs;
