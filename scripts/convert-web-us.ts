import fs from 'fs';
import path from 'path';

interface WebVerse {
  type: string;
  chapterNumber?: number;
  verseNumber?: number;
  sectionNumber?: number;
  value?: string;
}

interface AsvVerse {
  verse: number;
  text: string;
}

interface AsvChapter {
  chapter: number;
  verses: AsvVerse[];
}

interface AsvBook {
  name: string;
  chapters: AsvChapter[];
}

function convertWebToAsv(webData: WebVerse[]): AsvBook {
  const chapters: { [key: number]: { [key: number]: string[] } } = {};
  let currentChapter = 1;
  
  // Process each verse
  webData.forEach(item => {
    if (item.chapterNumber) {
      currentChapter = item.chapterNumber;
    }

    if (!chapters[currentChapter]) {
      chapters[currentChapter] = {};
    }

    // Handle both paragraph text and line text
    if ((item.type === 'paragraph text' || item.type === 'line text') && item.value && item.verseNumber) {
      if (!chapters[currentChapter][item.verseNumber]) {
        chapters[currentChapter][item.verseNumber] = [];
      }
      
      // Add the text section
      if (item.value.trim()) {
        chapters[currentChapter][item.verseNumber].push(item.value.trim());
      }
    }
  });
  
  // Convert the nested structure to ASV format
  const allChapters: AsvChapter[] = [];
  
  // Process each chapter
  Object.entries(chapters).forEach(([chapterNum, verses]) => {
    const chapterVerses: AsvVerse[] = [];
    
    // Process each verse in the chapter
    Object.entries(verses).forEach(([verseNum, textParts]) => {
      chapterVerses.push({
        verse: parseInt(verseNum),
        text: textParts.join(' ')
      });
    });
    
    // Add the chapter with its verses
    allChapters.push({
      chapter: parseInt(chapterNum),
      verses: chapterVerses.sort((a, b) => a.verse - b.verse)
    });
  });
  
  // Sort chapters by number
  allChapters.sort((a, b) => a.chapter - b.chapter);
  
  return {
    name: 'Book Name', // Will be set by the conversion script
    chapters: allChapters
  };
}

const BOOK_NAMES: { [key: string]: string } = {
  'genesis': 'Genesis',
  'exodus': 'Exodus',
  'leviticus': 'Leviticus',
  'numbers': 'Numbers',
  'deuteronomy': 'Deuteronomy',
  'joshua': 'Joshua',
  'judges': 'Judges',
  'ruth': 'Ruth',
  '1samuel': '1 Samuel',
  '2samuel': '2 Samuel',
  '1kings': '1 Kings',
  '2kings': '2 Kings',
  '1chronicles': '1 Chronicles',
  '2chronicles': '2 Chronicles',
  'ezra': 'Ezra',
  'nehemiah': 'Nehemiah',
  'esther': 'Esther',
  'job': 'Job',
  'psalms': 'Psalms',
  'proverbs': 'Proverbs',
  'ecclesiastes': 'Ecclesiastes',
  'songofsolomon': 'Song of Solomon',
  'isaiah': 'Isaiah',
  'jeremiah': 'Jeremiah',
  'lamentations': 'Lamentations',
  'ezekiel': 'Ezekiel',
  'daniel': 'Daniel',
  'hosea': 'Hosea',
  'joel': 'Joel',
  'amos': 'Amos',
  'obadiah': 'Obadiah',
  'jonah': 'Jonah',
  'micah': 'Micah',
  'nahum': 'Nahum',
  'habakkuk': 'Habakkuk',
  'zephaniah': 'Zephaniah',
  'haggai': 'Haggai',
  'zechariah': 'Zechariah',
  'malachi': 'Malachi',
  'matthew': 'Matthew',
  'mark': 'Mark',
  'luke': 'Luke',
  'john': 'John',
  'acts': 'Acts',
  'romans': 'Romans',
  '1corinthians': '1 Corinthians',
  '2corinthians': '2 Corinthians',
  'galatians': 'Galatians',
  'ephesians': 'Ephesians',
  'philippians': 'Philippians',
  'colossians': 'Colossians',
  '1thessalonians': '1 Thessalonians',
  '2thessalonians': '2 Thessalonians',
  '1timothy': '1 Timothy',
  '2timothy': '2 Timothy',
  'titus': 'Titus',
  'philemon': 'Philemon',
  'hebrews': 'Hebrews',
  'james': 'James',
  '1peter': '1 Peter',
  '2peter': '2 Peter',
  '1john': '1 John',
  '2john': '2 John',
  '3john': '3 John',
  'jude': 'Jude',
  'revelation': 'Revelation'
};

async function convertAllBooks() {
  const sourceDir = path.join(process.cwd(), 'public', 'bibles', 'web-us');
  const targetDir = path.join(process.cwd(), 'public', 'bibles', 'web');
  
  // Create target directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  // Process each file
  const files = fs.readdirSync(sourceDir);
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    
    // Extract book name from filename
    const bookId = file.replace('en_web-us_', '').replace('.json', '');
    const bookName = BOOK_NAMES[bookId] || bookId.charAt(0).toUpperCase() + bookId.slice(1);
    
    console.log(`Converting ${bookId}...`);
    
    try {
      // Read and convert
      const webData = JSON.parse(fs.readFileSync(path.join(sourceDir, file), 'utf-8'));
      const asvData = convertWebToAsv(webData);
      asvData.name = bookName;

      // Validate the conversion
      if (asvData.chapters.length === 0) {
        throw new Error('No chapters found');
      }
      if (asvData.chapters.some(c => c.verses.length === 0)) {
        throw new Error('Empty chapters found');
      }
      
      // Write converted file
      const targetFile = path.join(targetDir, `${bookId}.json`);
      fs.writeFileSync(targetFile, JSON.stringify(asvData, null, 2));
      console.log(`✅ Successfully converted ${bookId}`);
    } catch (error) {
      console.error(`❌ Failed to convert ${bookId}:`, error);
    }
  }
  
  console.log('Conversion complete!');
}

convertAllBooks().catch(console.error); 