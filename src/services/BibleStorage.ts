import { openDB, IDBPDatabase } from 'idb';

interface BibleVerse {
  verse: number;
  text: string;
}

class BibleStorage {
  private dbName = 'olive-bible-storage';
  private dbVersion = 1;
  private db: Promise<IDBPDatabase>;

  constructor() {
    this.db = this.initDB();
  }

  private async initDB() {
    return openDB(this.dbName, this.dbVersion, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('chapters')) {
          db.createObjectStore('chapters', { keyPath: ['bookId', 'chapter'] });
        }
      },
    });
  }

  async saveChapter(bookId: string, chapter: number, verses: BibleVerse[]) {
    const db = await this.db;
    await db.put('chapters', { bookId, chapter, verses });
  }

  async getChapter(bookId: string, chapter: number): Promise<BibleVerse[] | undefined> {
    const db = await this.db;
    const result = await db.get('chapters', [bookId, chapter]);
    return result?.verses;
  }

  async clearStorage() {
    const db = await this.db;
    await db.clear('chapters');
  }
}

export default new BibleStorage(); 