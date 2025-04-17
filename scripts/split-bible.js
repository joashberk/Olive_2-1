import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function splitBibleIntoBooks() {
  const bibleDir = path.join(process.cwd(), 'public/bibles');
  const booksDir = path.join(bibleDir, 'asv');
  
  // Create books directory if it doesn't exist
  if (!fs.existsSync(booksDir)) {
    fs.mkdirSync(booksDir, { recursive: true });
  }

  // Read the main Bible file
  console.log('Reading Bible data...');
  const bibleData = JSON.parse(fs.readFileSync(path.join(bibleDir, 'asv.min.json'), 'utf8'));

  // Create index file for quick book lookup
  const index = {};

  // Split into individual book files
  for (const [bookId, bookData] of Object.entries(bibleData)) {
    console.log(`Processing ${bookId}...`);
    
    // Save book data
    const bookPath = path.join(booksDir, `${bookId}.json`);
    fs.writeFileSync(bookPath, JSON.stringify(bookData));

    // Add to index
    index[bookId] = {
      name: bookData.name,
      chapterCount: bookData.chapters.length,
      size: fs.statSync(bookPath).size
    };

    // Split into chapter files if book is large
    const chaptersDir = path.join(booksDir, bookId);
    if (!fs.existsSync(chaptersDir)) {
      fs.mkdirSync(chaptersDir);
    }

    bookData.chapters.forEach((chapter, idx) => {
      const chapterNum = idx + 1;
      fs.writeFileSync(
        path.join(chaptersDir, `${chapterNum}.json`),
        JSON.stringify(chapter)
      );
    });
  }

  // Save index file
  fs.writeFileSync(
    path.join(booksDir, 'index.json'),
    JSON.stringify(index, null, 2)
  );

  console.log('Bible successfully split into individual books and chapters!');
}

splitBibleIntoBooks().catch(console.error); 