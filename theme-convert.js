const fs = require('fs');
const path = require('path');

const files = [
  'app/dashboard/streak/page.tsx',
  'app/dashboard/dokumentasi/page.tsx',
  'app/dashboard/gallery/page.tsx',
  'app/dashboard/memories/page.tsx',
  'app/dashboard/love-letters/page.tsx',
  'app/dashboard/bucket-list/page.tsx',
  'app/dashboard/biodata/page.tsx'
];

const replacements = [
  ['#f43f5e', '#2d8c6e'],
  ['#fb7185', '#5bb89a'],
  ['#fecdd3', '#c8ddd5'],
  ['#fda4af', '#a0c4b8'],
  ['#9f1239', '#1a5c47'],
  ['#be123c', '#1a5c47'],
  ['#e11d48', '#237a5e'],
  ['#ec4899', '#e8943a'],
  ['#fff1f2', '#f4f9f7'],
  ['#fce7f3', '#e3f0eb'],
  ['#fdf2f8', '#f4f9f7'],
  ['#ffe4e6', '#e3f0eb'],
  ['#ffe8ef', '#e3f0eb'],
  ['#fdf8f0', '#f0f5f3'],
  ['#fff8f9', '#f4f9f7'],
  ['#3d1a26', '#1e3a2f'],
  ['#881337', '#0f3d2e'],
  ['#7c1033', '#1a5c47'],
  ['#db2777', '#cc7a28'],
  ['#f472b6', '#f0ad4e'],
  ['#f9a8d4', '#f6c97a'],
  ['#fbcfe8', '#fbe0b0'],
  ['#9d174d', '#8a4e1c'],
  ['#831843', '#6b3c16'],
  ['rgba(244, 63, 94', 'rgba(45, 140, 110'],
  ['rgba(236, 72, 153', 'rgba(232, 148, 58'],
  ['rgba(244,63,94', 'rgba(45,140,110'],
  ['rgba(236,72,153', 'rgba(232,148,58'],
  ['💕', '🌿'],
  ['💝', '⭐'],
  ['💘', '🎯'],
  ['💌', '✉️'],
  ['💑', '👫'],
  ['❤️', '🌟'],
  ['♡', '✦'],
  ['Surat Cinta', 'Surat untuk Kamu'],
  ['Love Meter', 'Bonding Meter'],
  ['Love Quiz', 'Quiz Pasangan'],
  ['Perjalanan Cinta Kita', 'Perjalanan Kita Bersama'],
  ['Our Love Story', 'Our Story'],
  ['Kode Cinta', 'Kode Rahasia'],
  ['dashboard cinta', 'dashboard'],
  ['Pustaka Cinta', 'Pustaka'],
  ['Arsiparis Cinta', 'Arsiparis'],
  ['Pujangga Cinta', 'Pujangga'],
  ['Sineas Cinta', 'Sineas'],
  ['Api Cinta', 'Api'],
  ['Dua Minggu Cinta', 'Dua Minggu'],
  ['Mesin Waktu Cinta', 'Mesin Waktu'],
  ['Bank Soal Cinta', 'Bank Soal'],
  ['Profesor Cinta', 'Profesor'],
  ['Dua Tahun Cinta', 'Dua Tahun'],
  ['Quote Cinta', 'Quote Kita']
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    replacements.forEach(([oldStr, newStr]) => {
      content = content.split(oldStr).join(newStr);
    });
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + file);
  } else {
    console.log('File not found: ' + file);
  }
});
