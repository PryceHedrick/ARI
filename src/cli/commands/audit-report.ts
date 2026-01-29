/**
 * ARI Audit Report CLI Commands
 *
 * View and manage daily audit reports.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { dailyAudit, DailyAudit } from '../../autonomous/daily-audit.js';

export function createAuditReportCommand(): Command {
  const cmd = new Command('audit-report')
    .alias('report')
    .description('View ARI daily audit reports');

  cmd
    .command('today')
    .description('Show today\'s audit report')
    .action(async () => {
      const spinner = ora('Generating audit...').start();

      try {
        await dailyAudit.init();
        const audit = await dailyAudit.getTodayAudit();

        spinner.succeed('Today\'s Audit Report');
        printAudit(audit);
      } catch (error) {
        spinner.fail('Failed to generate audit');
        console.error(error);
      }
    });

  cmd
    .command('show <date>')
    .description('Show audit for specific date (YYYY-MM-DD)')
    .action(async (date: string) => {
      const spinner = ora(`Loading audit for ${date}...`).start();

      try {
        await dailyAudit.init();
        const audit = await dailyAudit.getAudit(date);

        if (!audit) {
          spinner.fail(`No audit found for ${date}`);
          return;
        }

        spinner.succeed(`Audit Report: ${date}`);
        printAudit(audit);
      } catch (error) {
        spinner.fail('Failed to load audit');
        console.error(error);
      }
    });

  cmd
    .command('list')
    .description('List all available audits')
    .option('-n, --limit <number>', 'Number of audits to show', '10')
    .action(async (options: { limit: string }) => {
      const spinner = ora('Loading audits...').start();

      try {
        await dailyAudit.init();
        const audits = await dailyAudit.listAudits();

        spinner.succeed(`Found ${audits.length} audit${audits.length !== 1 ? 's' : ''}`);

        const limit = parseInt(options.limit, 10);
        const toShow = audits.slice(0, limit);

        console.log(chalk.bold('\n📋 Available Audits\n'));
        for (const date of toShow) {
          console.log(`  ${chalk.cyan(date)}`);
        }

        if (audits.length > limit) {
          console.log(chalk.gray(`\n  ... and ${audits.length - limit} more`));
        }

        console.log(chalk.gray('\n  View with: npx ari audit-report show <date>\n'));
      } catch (error) {
        spinner.fail('Failed to list audits');
        console.error(error);
      }
    });

  cmd
    .command('metrics')
    .description('Show current metrics')
    .action(async () => {
      try {
        await dailyAudit.init();
        const metrics = dailyAudit.getMetrics();

        console.log(chalk.bold('\n📊 Current Metrics\n'));

        if (Object.keys(metrics).length === 0) {
          console.log(chalk.gray('  No metrics recorded yet today.'));
        } else {
          for (const [key, value] of Object.entries(metrics)) {
            const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const displayValue = key.includes('cost')
              ? chalk.yellow(`$${value.toFixed(2)}`)
              : chalk.cyan(value.toString());
            console.log(`  ${displayKey}: ${displayValue}`);
          }
        }

        console.log();
      } catch (error) {
        console.error('Failed to get metrics:', error);
      }
    });

  return cmd;
}

function printAudit(audit: DailyAudit): void {
  console.log(chalk.bold(`\n📋 ARI Daily Audit: ${audit.date}\n`));

  // Summary
  console.log(chalk.cyan('Summary:'));
  console.log(`  Total Activities: ${audit.summary.totalActivities}`);
  console.log(`  Successful: ${chalk.green(audit.summary.successful)}`);
  console.log(`  Failed: ${audit.summary.failed > 0 ? chalk.red(audit.summary.failed) : audit.summary.failed}`);
  console.log(`  Notifications Sent: ${audit.summary.notificationsSent}`);
  console.log(`  Batched: ${audit.summary.notificationsBatched}`);
  console.log(`  Tasks Completed: ${audit.summary.tasksCompleted}`);
  console.log(`  Insights: ${audit.summary.insightsGenerated}`);
  console.log(`  API Cost: ${chalk.yellow('$' + audit.summary.estimatedCost.toFixed(2))}`);
  console.log(`  Tokens Used: ${audit.summary.tokensUsed.toLocaleString()}`);

  // Highlights
  if (audit.highlights.length > 0) {
    console.log(chalk.cyan('\nHighlights:'));
    for (const h of audit.highlights) {
      console.log(`  ${chalk.green('✓')} ${h}`);
    }
  }

  // Issues
  if (audit.issues.length > 0) {
    console.log(chalk.cyan('\nIssues:'));
    for (const i of audit.issues) {
      console.log(`  ${chalk.red('!')} ${i}`);
    }
  }

  // Recommendations
  if (audit.recommendations.length > 0) {
    console.log(chalk.cyan('\nRecommendations:'));
    for (const r of audit.recommendations) {
      console.log(`  ${chalk.yellow('→')} ${r}`);
    }
  }

  // Recent activities (last 10)
  if (audit.activities.length > 0) {
    console.log(chalk.cyan('\nRecent Activities:'));
    const recent = audit.activities.slice(-10).reverse();
    for (const a of recent) {
      const time = new Date(a.timestamp).toLocaleTimeString();
      const status = a.outcome === 'success' ? chalk.green('✓') :
                    a.outcome === 'failure' ? chalk.red('✗') :
                    chalk.yellow('○');
      console.log(`  ${chalk.gray(time)} ${status} ${a.title}`);
    }

    if (audit.activities.length > 10) {
      console.log(chalk.gray(`  ... and ${audit.activities.length - 10} more activities`));
    }
  }

  // Hash chain
  console.log(chalk.gray(`\nAudit Hash: ${audit.hash.slice(0, 16)}...`));
  console.log(chalk.gray(`Previous:   ${audit.previousHash.slice(0, 16)}...`));
  console.log(chalk.gray(`Generated:  ${new Date(audit.generatedAt).toLocaleString()}`));
  console.log();
}
