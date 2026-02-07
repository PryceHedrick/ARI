import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { CONFIG_DIR } from '../../kernel/config.js';

// ── Type Definitions ────────────────────────────────────────────────────────

interface Task {
  id: number;
  text: string;
  priority: 'low' | 'normal' | 'high';
  status: 'open' | 'done';
  createdAt: string;
  completedAt?: string;
}

interface TaskStorage {
  tasks: Task[];
}

// ── File Path ───────────────────────────────────────────────────────────────

const TASKS_PATH = path.join(CONFIG_DIR, 'tasks.json');

// ── Storage Functions ───────────────────────────────────────────────────────

async function loadTasks(): Promise<Task[]> {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    const content = await fs.readFile(TASKS_PATH, 'utf-8');
    const storage = JSON.parse(content) as TaskStorage;
    return storage.tasks;
  } catch {
    // Return empty array if file doesn't exist
    return [];
  }
}

async function saveTasks(tasks: Task[]): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  const storage: TaskStorage = { tasks };
  await fs.writeFile(TASKS_PATH, JSON.stringify(storage, null, 2), 'utf-8');
}

function getNextId(tasks: Task[]): number {
  if (tasks.length === 0) return 1;
  return Math.max(...tasks.map((t) => t.id)) + 1;
}

function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

// ── Command Registration ────────────────────────────────────────────────────

export function registerTaskCommand(program: Command): void {
  const task = program
    .command('task')
    .description('Task management');

  // ── add ─────────────────────────────────────────────────────────────────
  task
    .command('add <text>')
    .description('Add a new task')
    .option('-p, --priority <level>', 'Priority level (low, normal, high)', 'normal')
    .option('--json', 'Output in JSON format')
    .action(async (text: string, options: { priority?: string; json?: boolean }) => {
      const priority = options.priority ?? 'normal';

      if (!['low', 'normal', 'high'].includes(priority)) {
        console.error(chalk.red(`Invalid priority: ${priority}`));
        console.error('Valid priorities: low, normal, high');
        process.exit(1);
      }

      const tasks = await loadTasks();
      const newTask: Task = {
        id: getNextId(tasks),
        text,
        priority: priority as 'low' | 'normal' | 'high',
        status: 'open',
        createdAt: new Date().toISOString(),
      };

      tasks.push(newTask);
      await saveTasks(tasks);

      if (options.json) {
        console.log(JSON.stringify(newTask, null, 2));
      } else {
        console.log(chalk.green(`✓ Added task #${newTask.id}`));
      }
    });

  // ── list ────────────────────────────────────────────────────────────────
  task
    .command('list')
    .description('List tasks')
    .option('--today', 'Show only today\'s tasks')
    .option('--all', 'Include completed tasks')
    .option('--json', 'Output in JSON format')
    .action(async (options: { today?: boolean; all?: boolean; json?: boolean }) => {
      let tasks = await loadTasks();

      // Filter by status
      if (!options.all) {
        tasks = tasks.filter((t) => t.status === 'open');
      }

      // Filter by date
      if (options.today) {
        tasks = tasks.filter((t) => {
          if (t.status === 'open') {
            return isToday(t.createdAt);
          } else {
            return t.completedAt ? isToday(t.completedAt) : false;
          }
        });
      }

      if (options.json) {
        console.log(JSON.stringify(tasks, null, 2));
        return;
      }

      if (tasks.length === 0) {
        console.log(chalk.gray('No tasks found'));
        return;
      }

      // Pretty print
      console.log('');
      for (const t of tasks) {
        let color: typeof chalk.red;
        if (t.status === 'done') {
          color = chalk.gray;
        } else {
          color = t.priority === 'high' ? chalk.red : chalk.white;
        }

        const priorityBadge = t.priority === 'high' ? chalk.red('[HIGH]') :
          t.priority === 'low' ? chalk.dim('[LOW]') : '';

        const statusText = t.status === 'done' ? color.strikethrough(t.text) : color(t.text);

        console.log(`  ${chalk.cyan(`#${t.id}`)} ${priorityBadge} ${statusText}`);
      }
      console.log('');
    });

  // ── done ────────────────────────────────────────────────────────────────
  task
    .command('done <id>')
    .description('Mark a task as complete')
    .option('--json', 'Output in JSON format')
    .action(async (id: string, options: { json?: boolean }) => {
      const taskId = parseInt(id, 10);
      if (isNaN(taskId)) {
        console.error(chalk.red(`Invalid task ID: ${id}`));
        process.exit(1);
      }

      const tasks = await loadTasks();
      const taskIndex = tasks.findIndex((t) => t.id === taskId);

      if (taskIndex === -1) {
        console.error(chalk.red(`Task #${taskId} not found`));
        process.exit(1);
      }

      tasks[taskIndex].status = 'done';
      tasks[taskIndex].completedAt = new Date().toISOString();

      await saveTasks(tasks);

      if (options.json) {
        console.log(JSON.stringify(tasks[taskIndex], null, 2));
      } else {
        console.log(chalk.green(`✓ Marked task #${taskId} as complete`));
      }
    });

  // ── remove ──────────────────────────────────────────────────────────────
  task
    .command('remove <id>')
    .description('Remove a task')
    .option('--json', 'Output in JSON format')
    .action(async (id: string, options: { json?: boolean }) => {
      const taskId = parseInt(id, 10);
      if (isNaN(taskId)) {
        console.error(chalk.red(`Invalid task ID: ${id}`));
        process.exit(1);
      }

      const tasks = await loadTasks();
      const taskIndex = tasks.findIndex((t) => t.id === taskId);

      if (taskIndex === -1) {
        console.error(chalk.red(`Task #${taskId} not found`));
        process.exit(1);
      }

      const removedTask = tasks.splice(taskIndex, 1)[0];
      await saveTasks(tasks);

      if (options.json) {
        console.log(JSON.stringify(removedTask, null, 2));
      } else {
        console.log(chalk.green(`✓ Removed task #${taskId}`));
      }
    });
}
