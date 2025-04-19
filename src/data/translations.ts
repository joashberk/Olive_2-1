export interface BibleTranslation {
  id: string;
  name: string;
  description: string;
  hasStrongs?: boolean;
}

export const translations: BibleTranslation[] = [
  {
    id: 'web',
    name: 'World English Bible (US)',
    description: 'A modern public domain translation based on the ASV.',
    hasStrongs: false
  },
  {
    id: 'kjv',
    name: 'King James Version',
    description: 'The classic 1611 English translation with Strong\'s numbers.',
    hasStrongs: true
  },
  {
    id: 'asv',
    name: 'American Standard Version',
    description: 'A literal translation of the Bible published in 1901.',
    hasStrongs: true
  }
]; 