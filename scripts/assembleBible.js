import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import bibleBooks data
const bibleBooks = [
  { id: 'genesis', name: 'Genesis', chapters: 50, testament: 'old' },
  // ... copy the rest from src/data/bibleBooks.ts
];

async function assembleBible() {
  const bibleData = {};
  const sourceDir = path.join(__dirname, '..', 'downloaded_bible');
  const outputFile = path.join(__dirname, '..', 'public', 'bible.min.json');

  console.log('Starting Bible assembly...');

  for (const book of bibleBooks) {
    try {
      const filePath = path.join(sourceDir, `${book.id}.json`);
      console.log(`Processing ${book.name}...`);
      
      const rawData = await fs.promises.readFile(filePath, 'utf8');
      const bookData = JSON.parse(rawData);
      
      bibleData[book.id] = {
        name: book.name,
        chapters: []
      };

      // Process each chapter
      for (let i = 0; i < bookData.chapters.length; i++) {
        const chapter = bookData.chapters[i];
        bibleData[book.id].chapters[i] = {
          chapter: i + 1,
          verses: chapter.verses.map(verse => ({
            verse: verse.verse,
            text: verse.text
          }))
        };
      }
    } catch (error) {
      console.error(`Error processing ${book.name}:`, error);
    }
  }

  // Write the assembled data to bible.min.json
  try {
    await fs.promises.writeFile(
      outputFile,
      JSON.stringify(bibleData),
      'utf8'
    );
    console.log(`Bible data written to ${outputFile}`);
  } catch (error) {
    console.error('Error writing bible.min.json:', error);
    process.exit(1);
  }
}

assembleBible().catch(console.error);