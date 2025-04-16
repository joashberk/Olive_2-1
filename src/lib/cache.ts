const DB_NAME = 'bible';
const DB_VERSION = 10;
const STORE_NAME = 'chapters';
const VERSES_STORE = 'verses';

export interface ChapterRecord {
  verses: VerseRecord[];
  length?: number;
}

export interface VerseRecord {
  verse: number;
  text: string;
  words: any[];
  reference?: string;
}

export class BibleStorage {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  static async openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: ['book', 'chapter'] });
          store.createIndex('book', 'book', { unique: false });
          store.createIndex('composite_key', ['book', 'chapter'], { unique: true });
        }
        if (!db.objectStoreNames.contains(VERSES_STORE)) {
          const versesStore = db.createObjectStore(VERSES_STORE, { keyPath: 'reference' });
          versesStore.createIndex('book_chapter', ['book', 'chapter'], { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  static async saveChapter(book: string, chapter: number, verses: ChapterRecord['verses']): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ book, chapter, verses });
      tx.oncomplete = () => resolve();
      tx.onerror = () => {
        console.error('Transaction error:', tx.error);
        reject(tx.error);
      };
    });
  }

  static async saveVerse(verse: VerseRecord): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(VERSES_STORE, 'readwrite');
      const store = tx.objectStore(VERSES_STORE);
      store.put(verse);
      tx.oncomplete = () => resolve();
      tx.onerror = () => {
        console.error('Transaction error:', tx.error);
        reject(tx.error);
      };
    });
  }

  static async getChapter(book: string, chapter: number): Promise<ChapterRecord | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get([book, chapter]);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  static async isChapterLoaded(book: string, chapter: number): Promise<boolean> {
    const chapterData = await this.getChapter(book, chapter);
    return !!chapterData;
  }

  static async clear(): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME, VERSES_STORE], 'readwrite');
      const chaptersStore = tx.objectStore(STORE_NAME);
      const versesStore = tx.objectStore(VERSES_STORE);
      
      chaptersStore.clear();
      versesStore.clear();
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  static async searchVerses(query: string): Promise<VerseRecord[]> {
    // Implementation needed
    return [];
  }
}