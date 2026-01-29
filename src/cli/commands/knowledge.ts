/**
 * ARI Knowledge Management CLI Commands
 *
 * Manage the curated knowledge base.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { knowledgeFetcher } from '../../autonomous/knowledge-fetcher.js';
import {
  KNOWLEDGE_SOURCES,
  getVerifiedSources,
  getEnabledSources,
} from '../../autonomous/knowledge-sources.js';

export function createKnowledgeCommand(): Command {
  const cmd = new Command('knowledge')
    .alias('kb')
    .description('Manage ARI knowledge base');

  cmd
    .command('sources')
    .description('List all knowledge sources')
    .option('--all', 'Show all sources including disabled')
    .action((options: { all?: boolean }) => {
      console.log(chalk.bold('\n📚 Knowledge Sources\n'));

      const sources = options.all ? KNOWLEDGE_SOURCES : getEnabledSources();

      // Group by category
      const byCategory = new Map<string, typeof sources>();
      for (const source of sources) {
        const existing = byCategory.get(source.category) || [];
        existing.push(source);
        byCategory.set(source.category, existing);
      }

      for (const [category, categorySources] of byCategory) {
        console.log(chalk.cyan(`\n  ${category}`));
        console.log(chalk.gray('  ' + '─'.repeat(40)));

        for (const source of categorySources) {
          const status = source.enabled ? chalk.green('●') : chalk.gray('○');
          const trust = source.trust === 'verified'
            ? chalk.green('verified')
            : chalk.yellow('standard');

          console.log(`  ${status} ${chalk.bold(source.name)}`);
          console.log(`    ${chalk.gray(source.url)}`);
          console.log(`    Trust: ${trust} | Updates: ${source.updateFrequency}`);
        }
      }

      console.log(chalk.gray(`\n  Total: ${sources.length} sources`));
      console.log(chalk.gray(`  Verified: ${getVerifiedSources().length}`));
      console.log();
    });

  cmd
    .command('fetch')
    .description('Fetch knowledge from sources')
    .option('--all', 'Fetch from all sources (not just verified)')
    .option('--source <id>', 'Fetch from specific source')
    .action(async (options: { all?: boolean; source?: string }) => {
      const spinner = ora('Fetching knowledge...').start();

      try {
        if (options.source) {
          // Fetch specific source
          const source = KNOWLEDGE_SOURCES.find(s => s.id === options.source);
          if (!source) {
            spinner.fail(`Source not found: ${options.source}`);
            return;
          }

          spinner.text = `Fetching ${source.name}...`;
          const result = await knowledgeFetcher.fetchSource(source);

          if (result) {
            spinner.succeed(`Fetched ${source.name}`);
            console.log(chalk.gray(`  Title: ${result.title}`));
            console.log(chalk.gray(`  Size: ${result.rawLength} bytes`));
            console.log(chalk.gray(`  Hash: ${result.contentHash}`));
          } else {
            spinner.fail(`Failed to fetch ${source.name}`);
          }
        } else {
          // Fetch all
          spinner.text = 'Fetching from all sources...';
          const log = await knowledgeFetcher.fetchAll(!options.all);

          spinner.succeed('Knowledge fetch complete');

          console.log(chalk.bold('\n📊 Results:\n'));
          console.log(chalk.green(`  ✓ Fetched: ${log.fetched.length} sources`));

          if (log.errors.length > 0) {
            console.log(chalk.red(`  ✗ Errors: ${log.errors.length}`));
            for (const err of log.errors) {
              console.log(chalk.gray(`    - ${err.sourceId}: ${err.error}`));
            }
          }

          if (log.fetched.length > 0) {
            console.log(chalk.bold('\n  Content fetched:'));
            for (const content of log.fetched) {
              console.log(`    ${chalk.cyan(content.sourceName)}`);
              console.log(chalk.gray(`      ${content.title.slice(0, 60)}...`));
            }
          }
        }

        console.log();
      } catch (error) {
        spinner.fail('Fetch failed');
        console.error(error);
      }
    });

  cmd
    .command('list')
    .description('List stored knowledge')
    .action(async () => {
      const spinner = ora('Loading knowledge base...').start();

      try {
        const knowledge = await knowledgeFetcher.listKnowledge();

        spinner.succeed(`Found ${knowledge.length} knowledge entries`);

        if (knowledge.length === 0) {
          console.log(chalk.yellow('\n  No knowledge stored yet.'));
          console.log(chalk.gray('  Run: npx ari knowledge fetch\n'));
          return;
        }

        // Group by category
        const byCategory = new Map<string, typeof knowledge>();
        for (const item of knowledge) {
          const existing = byCategory.get(item.category) || [];
          existing.push(item);
          byCategory.set(item.category, existing);
        }

        for (const [category, items] of byCategory) {
          console.log(chalk.cyan(`\n  ${category} (${items.length})`));

          for (const item of items.slice(0, 5)) {
            const age = getAge(item.fetchedAt);
            console.log(`    ${chalk.bold(item.title.slice(0, 50))}`);
            console.log(chalk.gray(`      ${item.sourceName} • ${age}`));
          }

          if (items.length > 5) {
            console.log(chalk.gray(`      ... and ${items.length - 5} more`));
          }
        }

        console.log();
      } catch (error) {
        spinner.fail('Failed to list knowledge');
        console.error(error);
      }
    });

  cmd
    .command('status')
    .description('Show knowledge base status')
    .action(async () => {
      console.log(chalk.bold('\n🧠 Knowledge Base Status\n'));

      // Show last fetch
      const log = await knowledgeFetcher.getLastLog();
      if (log) {
        const age = getAge(log.lastRun);
        console.log(`  Last fetch: ${age}`);
        console.log(`  Sources fetched: ${log.fetched.length}`);
        console.log(`  Errors: ${log.errors.length}`);
      } else {
        console.log(chalk.yellow('  Never fetched'));
      }

      // Show source stats
      const verified = getVerifiedSources();
      const enabled = getEnabledSources();
      console.log(`\n  Sources:`);
      console.log(`    Total: ${KNOWLEDGE_SOURCES.length}`);
      console.log(`    Enabled: ${enabled.length}`);
      console.log(`    Verified: ${verified.length}`);

      // Show storage stats
      const knowledge = await knowledgeFetcher.listKnowledge();
      console.log(`\n  Stored knowledge: ${knowledge.length} entries`);

      console.log();
    });

  return cmd;
}

function getAge(isoDate: string): string {
  const ms = Date.now() - new Date(isoDate).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return 'just now';
}
