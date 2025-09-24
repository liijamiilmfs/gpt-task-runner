import fs from 'fs/promises';
import path from 'path';
import { log } from './logger';
import type { Phrase, PhraseCategory, PhraseDifficulty, PhraseFilter, PhraseBook } from './types/phrase';

// Re-export types for API usage
export type { PhraseFilter, PhraseCategory, PhraseDifficulty } from './types/phrase';

export class PhraseService {
  private phraseBook: PhraseBook | null = null;
  private phraseBookPath: string;

  constructor() {
    // Handle both development and test environments
    const basePath = process.env.NODE_ENV === 'test' ? process.cwd() : process.cwd();
    this.phraseBookPath = path.join(basePath, 'data', 'phrasebook.json');
  }

  private async loadPhraseBook(): Promise<PhraseBook> {
    if (this.phraseBook) {
      return this.phraseBook;
    }

    try {
      log.debug('Loading phrase book from path', { path: this.phraseBookPath });
      const fileContent = await fs.readFile(this.phraseBookPath, 'utf-8');
      this.phraseBook = JSON.parse(fileContent) as PhraseBook;
      log.info('Phrase book loaded successfully', { 
        totalPhrases: this.phraseBook.phrases.length,
        categories: this.phraseBook.metadata.categories.length
      });
      return this.phraseBook;
    } catch (error) {
      log.error('Failed to load phrase book', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        path: this.phraseBookPath,
        cwd: process.cwd()
      });
      throw new Error('Failed to load phrase book');
    }
  }

  async getRandomPhrase(filter?: PhraseFilter): Promise<Phrase | null> {
    const phraseBook = await this.loadPhraseBook();
    let filteredPhrases = phraseBook.phrases;

    if (filter) {
      filteredPhrases = this.filterPhrases(phraseBook.phrases, filter);
    }

    if (filteredPhrases.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * filteredPhrases.length);
    return filteredPhrases[randomIndex];
  }

  async getPhrases(filter?: PhraseFilter, limit?: number): Promise<Phrase[]> {
    const phraseBook = await this.loadPhraseBook();
    let filteredPhrases = phraseBook.phrases;

    if (filter) {
      filteredPhrases = this.filterPhrases(phraseBook.phrases, filter);
    }

    if (limit && limit > 0) {
      filteredPhrases = filteredPhrases.slice(0, limit);
    }

    return filteredPhrases;
  }

  async getPhraseById(id: string): Promise<Phrase | null> {
    const phraseBook = await this.loadPhraseBook();
    return phraseBook.phrases.find(phrase => phrase.id === id) || null;
  }

  async getCategories(): Promise<string[]> {
    const phraseBook = await this.loadPhraseBook();
    return phraseBook.metadata.categories;
  }

  async getPhrasesByCategory(category: string): Promise<Phrase[]> {
    return this.getPhrases({ category: category as PhraseCategory });
  }

  async searchPhrases(query: string): Promise<Phrase[]> {
    const phraseBook = await this.loadPhraseBook();
    const searchTerm = query.toLowerCase();
    
    return phraseBook.phrases.filter(phrase => 
      phrase.english.toLowerCase().includes(searchTerm) ||
      phrase.ancient.toLowerCase().includes(searchTerm) ||
      phrase.modern.toLowerCase().includes(searchTerm) ||
      phrase.context.toLowerCase().includes(searchTerm)
    );
  }

  async getPhraseOfTheDay(): Promise<Phrase | null> {
    const phraseBook = await this.loadPhraseBook();
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    
    const phraseIndex = dayOfYear % phraseBook.phrases.length;
    return phraseBook.phrases[phraseIndex];
  }

  private filterPhrases(phrases: Phrase[], filter: PhraseFilter): Phrase[] {
    return phrases.filter(phrase => {
      if (filter.category && phrase.category !== filter.category) {
        return false;
      }
      
      if (filter.difficulty && phrase.difficulty !== filter.difficulty) {
        return false;
      }
      
      if (filter.search) {
        const searchTerm = filter.search.toLowerCase();
        const matchesSearch = 
          phrase.english.toLowerCase().includes(searchTerm) ||
          phrase.ancient.toLowerCase().includes(searchTerm) ||
          phrase.modern.toLowerCase().includes(searchTerm) ||
          phrase.context.toLowerCase().includes(searchTerm);
        
        if (!matchesSearch) {
          return false;
        }
      }
      
      return true;
    });
  }

  async getPhraseStats(): Promise<{
    totalPhrases: number;
    categories: Record<string, number>;
    difficulties: Record<string, number>;
  }> {
    const phraseBook = await this.loadPhraseBook();
    
    const categories: Record<string, number> = {};
    const difficulties: Record<string, number> = {};
    
    phraseBook.phrases.forEach(phrase => {
      categories[phrase.category] = (categories[phrase.category] || 0) + 1;
      difficulties[phrase.difficulty] = (difficulties[phrase.difficulty] || 0) + 1;
    });
    
    return {
      totalPhrases: phraseBook.phrases.length,
      categories,
      difficulties
    };
  }
}

// Export singleton instance
export const phraseService = new PhraseService();
