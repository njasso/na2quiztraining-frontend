const fs = require('fs');
const { parse } = require('json2csv');

function saveAsCSV(questions, filePath) {
  const csv = parse(questions);
  fs.writeFileSync(filePath, csv, 'utf8');
}

function saveAsJSON(questions, filePath) {
  fs.writeFileSync(filePath, JSON.stringify(questions, null, 2), 'utf8');
}

module.exports = { saveAsCSV, saveAsJSON };
