import { bibleBooks } from '@/data/bibleBooks';

export function formatStrongsNumber(strongsNumber: string): string {
  // Remove any non-alphanumeric characters
  const cleanNumber = strongsNumber.replace(/[^a-zA-Z0-9]/g, '');
  const prefix = cleanNumber.charAt(0).toUpperCase();
  const number = cleanNumber.slice(1);
  
  // Pad the number portion to 4 digits
  return `${prefix}${number.padStart(4, '0')}`;
}

export function isHebrewWord(text: string): boolean {
  return /[\u0590-\u05FF]/.test(text);
}

export function isGreekWord(text: string): boolean {
  return /[\u0370-\u03FF\u1F00-\u1FFF]/.test(text);
}

export function unpadStrongsNumber(strongsNumber: string): string {
  return strongsNumber.replace(/^([GH])0+/, '$1');
}

// Utility for conditional class names
export function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// Add sleep utility function
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Enhanced function to repair malformed verse references
export function repairVerseReference(reference: string): string | null {
  try {
    // If it's already in the correct format (Book Chapter:Verse), validate and return
    if (/^[A-Za-z0-9\s]+ \d+:\d+$/.test(reference)) {
      const { bookId, chapter, verse } = parseVerseReference(reference);
      if (bookId && chapter && verse) {
        return reference;
      }
    }

    // Handle different malformed cases
    
    // Case 1: Just a number (e.g., "8")
    if (/^\d+$/.test(reference)) {
      console.warn(`Invalid reference (number only): ${reference}`);
      return null;
    }

    // Case 2: API format (e.g., "HEB.11.8")
    const apiFormatMatch = reference.match(/^([A-Z]+)\.(\d+)\.(\d+)$/i);
    if (apiFormatMatch) {
      const [_, bookCode, chapter, verse] = apiFormatMatch;
      const bookId = bookCode.toLowerCase();
      const book = bibleBooks.find(b => b.id === bookId);
      
      if (!book) {
        console.warn(`Unknown book ID: ${bookId} in reference: ${reference}`);
        return null;
      }

      return `${book.name} ${chapter}:${verse}`;
    }

    // Case 3: Partial format (e.g., "Chapter 11:8")
    const partialMatch = reference.match(/^(?:Chapter )?(\d+):(\d+)$/);
    if (partialMatch) {
      console.warn(`Incomplete reference: ${reference}`);
      return null;
    }

    // Case 4: Book.Chapter.Verse format (e.g., "genesis.1.1")
    const dotFormatMatch = reference.match(/^([a-z0-9]+)\.(\d+)\.(\d+)$/i);
    if (dotFormatMatch) {
      const [_, bookId, chapter, verse] = dotFormatMatch;
      const book = bibleBooks.find(b => b.id === bookId.toLowerCase());
      
      if (!book) {
        console.warn(`Unknown book ID: ${bookId} in reference: ${reference}`);
        return null;
      }

      return `${book.name} ${chapter}:${verse}`;
    }

    // If we can't repair it, log and return null
    console.warn(`Unable to repair malformed reference: ${reference}`);
    return null;
  } catch (error) {
    console.error('Error repairing verse reference:', error);
    return null;
  }
}

// Function to validate a verse reference
export function isValidReference(reference: string): boolean {
  const { bookId, chapter, verse } = parseVerseReference(reference);
  if (!bookId || !chapter || !verse) {
    return false;
  }

  const book = bibleBooks.find(b => b.id === bookId);
  if (!book) {
    return false;
  }

  // Validate chapter and verse numbers
  if (chapter < 1 || chapter > book.chapters) {
    return false;
  }

  // Note: We can't validate verse numbers without knowing the total verses per chapter
  // So we'll just do a basic sanity check
  if (verse < 1 || verse > 200) {
    return false;
  }

  return true;
}

// New function to check if a reference needs repair
export function needsReferenceRepair(reference: string): boolean {
  if (!reference) return true;
  return !(/^[A-Za-z0-9\s]+ \d+:\d+$/.test(reference) && isValidReference(reference));
}

// Enhanced function to parse verse reference into components
export function parseVerseReference(reference: string): { 
  bookId: string | null;
  chapter: number | null;
  verse: number | null;
} {
  try {
    // Match the Book Chapter:Verse format
    const match = reference.match(/^(.+) (\d+):(\d+)$/);
    if (!match) {
      return { bookId: null, chapter: null, verse: null };
    }

    const [_, bookName, chapter, verse] = match;
    
    // Find the book ID from the name
    const book = bibleBooks.find(b => b.name === bookName);
    if (!book) {
      // Try to find by ID (lowercase)
      const bookByCode = bibleBooks.find(b => b.id.toLowerCase() === bookName.toLowerCase());
      if (!bookByCode) {
        return { bookId: null, chapter: null, verse: null };
      }
      return {
        bookId: bookByCode.id,
        chapter: parseInt(chapter, 10),
        verse: parseInt(verse, 10)
      };
    }

    return {
      bookId: book.id,
      chapter: parseInt(chapter, 10),
      verse: parseInt(verse, 10)
    };
  } catch (error) {
    console.error('Error parsing verse reference:', error);
    return { bookId: null, chapter: null, verse: null };
  }
}

// New function to create a standardized verse reference
export function createVerseReference(bookId: string, chapter: number, verse: number): string | null {
  try {
    const book = bibleBooks.find(b => b.id === bookId);
    if (!book) {
      return null;
    }

    return `${book.name} ${chapter}:${verse}`;
  } catch (error) {
    console.error('Error creating verse reference:', error);
    return null;
  }
}

export function capitalizeBookName(bookId: string): string {
  const book = bibleBooks.find(b => b.id === bookId);
  if (!book) return bookId;
  
  // Handle special cases like "1 Samuel", "2 Kings", etc.
  if (book.name.match(/^\d\s/)) {
    const [num, ...rest] = book.name.split(' ');
    return `${num} ${rest.map(capitalizeWord).join(' ')}`;
  }
  
  return capitalizeWord(book.name);
}

function capitalizeWord(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

interface VerseSelection {
  start: number;
  end?: number;
}

export function formatVerseReference(bookId: string, chapter: number, verses: VerseSelection[]): string {
  if (!verses.length) return '';
  
  // Get proper book name
  const book = bibleBooks.find(b => b.id === bookId);
  if (!book) return '';
  
  // Extract all verse numbers and handle ranges
  const allVerses = verses.reduce((acc: number[], selection) => {
    if (selection.end) {
      // Add all verses in the range
      for (let i = selection.start; i <= selection.end; i++) {
        acc.push(i);
      }
    } else {
      // Add single verse
      acc.push(selection.start);
    }
    return acc;
  }, []);
  
  // Sort verses numerically and remove duplicates
  const sortedVerses = [...new Set(allVerses)].sort((a, b) => a - b);
  
  // Group consecutive verses
  const groups: number[][] = [];
  let currentGroup: number[] = [sortedVerses[0]];
  
  for (let i = 1; i < sortedVerses.length; i++) {
    if (sortedVerses[i] === sortedVerses[i-1] + 1) {
      currentGroup.push(sortedVerses[i]);
    } else {
      groups.push([...currentGroup]);
      currentGroup = [sortedVerses[i]];
    }
  }
  groups.push(currentGroup);

  // Format each group
  const verseRefs = groups.map(group => {
    if (group.length === 1) {
      return group[0].toString();
    }
    return `${group[0]}-${group[group.length - 1]}`;
  });

  // Join with semicolons
  return `${book.name} ${chapter}:${verseRefs.join('; ')}`;
}

export function parseVerseRanges(verseStr: string): number[] {
  const verses: number[] = [];
  
  // Split by semicolon and process each part
  const parts = verseStr.split(';').map(p => p.trim());
  
  for (const part of parts) {
    if (part.includes('-')) {
      // Handle range (e.g., "1-3")
      const [start, end] = part.split('-').map(n => parseInt(n));
      for (let i = start; i <= end; i++) {
        verses.push(i);
      }
    } else {
      // Handle single verse
      verses.push(parseInt(part));
    }
  }
  
  return [...new Set(verses)].sort((a, b) => a - b);
}

export async function decompressGzip(compressedData: ArrayBuffer): Promise<string> {
  const ds = new DecompressionStream('gzip');
  const decompressedStream = new Response(compressedData).body?.pipeThrough(ds);
  if (!decompressedStream) {
    throw new Error('Failed to create decompression stream');
  }
  const decompressedData = await new Response(decompressedStream).text();
  return decompressedData;
}

export function stripHtmlTags(html: string): string {
  // Create a temporary div element
  const temp = document.createElement('div');
  // Replace <br> and </p> tags with spaces before setting innerHTML
  const processedHtml = html.replace(/(<br>|<\/p>)/g, ' ');
  // Set the HTML content
  temp.innerHTML = processedHtml;
  // Get the text content and normalize spaces
  return (temp.textContent || temp.innerText || '').replace(/\s+/g, ' ').trim();
}