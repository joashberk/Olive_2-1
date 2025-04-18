import { openDB, IDBPDatabase } from 'idb';

interface BibleVerse {
  verse: number;
  text: string;
  words?: {
    word: string;
    strong: string;
  }[];
}

interface StoredVerse {
  verseNumber: number;
  text: string;
  words?: {
    word: string;
    strong: string;
  }[];
}

interface SearchResult {
  book: string;
  chapter: number;
  verseNumber: number;
  text: string;
  words?: {
    word: string;
    strong: string;
  }[];
}

const DB_NAME = 'BibleStorage';
const DB_VERSION = 2;
const CHAPTERS_STORE = 'chapters';
const SEARCH_INDEX_STORE = 'searchIndex';

let db: IDBPDatabase | null = null;

async function getDB() {
  if (!db) {
    db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create stores if they don't exist
        if (!db.objectStoreNames.contains(CHAPTERS_STORE)) {
          db.createObjectStore(CHAPTERS_STORE);
        }
        if (!db.objectStoreNames.contains(SEARCH_INDEX_STORE)) {
          const store = db.createObjectStore(SEARCH_INDEX_STORE, { keyPath: 'id' });
          store.createIndex('text', 'text');
        }
      },
    });
  }
  return db;
}

const BibleStorage = {
  async saveChapter(bookId: string, chapter: number, verses: StoredVerse[]) {
    const db = await getDB();
    const key = `${bookId}:${chapter}`;
    await db.put(CHAPTERS_STORE, { verses }, key);

    // Update search index
    const searchStore = db.transaction(SEARCH_INDEX_STORE, 'readwrite').objectStore(SEARCH_INDEX_STORE);
    for (const verse of verses) {
      const id = `${bookId}:${chapter}:${verse.verseNumber}`;
      await searchStore.put({
        id,
        text: verse.text.toLowerCase(),
        book: bookId,
        chapter,
        verseNumber: verse.verseNumber,
        words: verse.words
      });
    }
  },

  async getChapter(bookId: string, chapter: number) {
    const db = await getDB();
    const key = `${bookId}:${chapter}`;
    return db.get(CHAPTERS_STORE, key);
  },

  async isChapterLoaded(bookId: string, chapter: number) {
    const db = await getDB();
    const key = `${bookId}:${chapter}`;
    const result = await db.get(CHAPTERS_STORE, key);
    return !!result;
  },

  async searchVerses(query: string): Promise<SearchResult[]> {
    const db = await getDB();
    const tx = db.transaction(SEARCH_INDEX_STORE, 'readonly');
    const store = tx.objectStore(SEARCH_INDEX_STORE);
    const index = store.index('text');
    
    const searchText = query.toLowerCase();
    const results: SearchResult[] = [];
    
    // Use a cursor to iterate through all verses
    let cursor = await index.openCursor();
    
    while (cursor) {
      const value = cursor.value;
      if (value.text.includes(searchText)) {
        results.push({
          book: value.book,
          chapter: value.chapter,
          verseNumber: value.verseNumber,
          text: value.text,
          words: value.words
        });
      }
      cursor = await cursor.continue();
    }
    
    return results;
  },

  async clearAll() {
    const db = await getDB();
    await db.clear(CHAPTERS_STORE);
    await db.clear(SEARCH_INDEX_STORE);
  }
};

export default BibleStorage; 