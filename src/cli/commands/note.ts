import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { CONFIG_DIR } from '../../kernel/config.js';

interface Note {
  id: number;
  text: string;
  tags: string[];
  createdAt: string;
}

const NOTES_PATH = path.join(CONFIG_DIR, 'notes.json');

/**
 * Loads notes from disk. Returns empty array if file doesn't exist.
 */
async function loadNotes(): Promise<Note[]> {
  try {
    const content = await fs.readFile(NOTES_PATH, 'utf-8');
    return JSON.parse(content) as Note[];
  } catch {
    return [];
  }
}

/**
 * Saves notes to disk. Creates directory if needed.
 */
async function saveNotes(notes: Note[]): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(NOTES_PATH, JSON.stringify(notes, null, 2), 'utf-8');
}

/**
 * Generates next note ID based on existing notes.
 */
function getNextId(notes: Note[]): number {
  if (notes.length === 0) return 1;
  return Math.max(...notes.map((n) => n.id)) + 1;
}

/**
 * Formats a note for display.
 */
function formatNote(note: Note, showId = true): string {
  const date = new Date(note.createdAt);
  const dateStr = chalk.gray(date.toLocaleString());
  const idStr = showId ? chalk.gray(`[${note.id}] `) : '';
  const tagsStr = note.tags.length > 0 ? ' ' + note.tags.map((t) => chalk.cyan(`#${t}`)).join(' ') : '';
  return `${idStr}${note.text}${tagsStr} ${dateStr}`;
}

export function registerNoteCommand(program: Command): void {
  // Command: ari note "text" [--tag tag]
  program
    .command('note <text>')
    .description('Save a quick note')
    .option('-t, --tag <tag>', 'Add a tag to the note')
    .option('--json', 'Output as JSON')
    .action(async (text: string, options: { tag?: string; json?: boolean }) => {
      try {
        const notes = await loadNotes();

        const newNote: Note = {
          id: getNextId(notes),
          text,
          tags: options.tag ? [options.tag] : [],
          createdAt: new Date().toISOString(),
        };

        notes.push(newNote);
        await saveNotes(notes);

        if (options.json) {
          console.log(JSON.stringify(newNote, null, 2));
        } else {
          console.log(chalk.green('✓ Note saved:'));
          console.log(formatNote(newNote));
        }
      } catch (error) {
        console.error(chalk.red('Error saving note:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // Command: ari notes [--all] [search <query>]
  const notesCommand = program
    .command('notes')
    .description('List or search notes')
    .option('-a, --all', 'Show all notes (default: last 10)')
    .option('--json', 'Output as JSON')
    .action(async (options: { all?: boolean; json?: boolean }) => {
      try {
        const notes = await loadNotes();

        if (notes.length === 0) {
          if (options.json) {
            console.log(JSON.stringify([], null, 2));
          } else {
            console.log(chalk.yellow('No notes found. Create one with: ari note "your text"'));
          }
          return;
        }

        // Sort by most recent first
        const sorted = [...notes].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Limit to last 10 unless --all flag
        const display = options.all ? sorted : sorted.slice(0, 10);

        if (options.json) {
          console.log(JSON.stringify(display, null, 2));
        } else {
          console.log(chalk.blue(`\n${display.length === notes.length ? 'All' : 'Recent'} Notes:\n`));
          display.forEach((note) => console.log(formatNote(note)));

          if (!options.all && notes.length > 10) {
            console.log(chalk.gray(`\n(Showing 10 of ${notes.length} notes. Use --all to see all)`));
          }
        }
      } catch (error) {
        console.error(chalk.red('Error loading notes:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // Subcommand: ari notes search <query>
  notesCommand
    .command('search <query>')
    .description('Search notes by text or tags')
    .option('--json', 'Output as JSON')
    .action(async (query: string, options: { json?: boolean }) => {
      try {
        const notes = await loadNotes();
        const lowerQuery = query.toLowerCase();

        // Case-insensitive search in text and tags
        const matches = notes.filter((note) =>
          note.text.toLowerCase().includes(lowerQuery) ||
          note.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
        );

        // Sort by most recent first
        const sorted = matches.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        if (options.json) {
          console.log(JSON.stringify(sorted, null, 2));
        } else {
          if (sorted.length === 0) {
            console.log(chalk.yellow(`No notes found matching "${query}"`));
          } else {
            console.log(chalk.blue(`\nFound ${sorted.length} note${sorted.length === 1 ? '' : 's'} matching "${query}":\n`));
            sorted.forEach((note) => console.log(formatNote(note)));
          }
        }
      } catch (error) {
        console.error(chalk.red('Error searching notes:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
