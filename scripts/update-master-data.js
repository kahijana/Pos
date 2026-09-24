import fs from 'fs';
import XLSX from 'xlsx';

const wb = XLSX.readFile('master-barang-2026-09-24 (1).xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const csv = XLSX.utils.sheet_to_csv(sheet);
const cleanCsv = csv.split(/\r?\n/).filter(l => l.trim().length > 0).join('\n');

const fileContent = `export const DEFAULT_CSV_DATA = \`${cleanCsv.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`;\n`;

fs.writeFileSync('src/data/defaultCsv.ts', fileContent, 'utf8');
console.log('Successfully updated src/data/defaultCsv.ts with', cleanCsv.split('\n').length, 'lines.');
