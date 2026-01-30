/**
 * ARI Notion Client
 *
 * Integrates with Notion for:
 * - Daily logs and briefings
 * - Task management
 * - Notification inbox
 * - Activity logging
 */

import { Client } from '@notionhq/client';

export interface NotionConfig {
  apiKey: string;
  dailyLogsPageId: string;  // Parent page for daily logs
  tasksDbId: string;        // Tasks database ID
  inboxDbId?: string;       // Optional: separate inbox database
}

export interface DailyLogEntry {
  title: string;
  content: string;
  category: 'briefing' | 'summary' | 'notification' | 'action' | 'error';
  priority?: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
  timestamp?: Date;
}

export interface TaskEntry {
  name: string;
  status: 'Not started' | 'In progress' | 'Done';
  priority: 'High' | 'Medium' | 'Low';
  description?: string;
  dueDate?: Date;
}

export interface NotificationEntry {
  title: string;
  body: string;
  category: string;
  priority: string;
  timestamp: Date;
  acknowledged?: boolean;
}

// Simplified page result type
interface PageResult {
  id: string;
  object: string;
  properties?: Record<string, unknown>;
}

export class NotionClient {
  private client: Client;
  private config: NotionConfig;

  constructor(config: NotionConfig) {
    this.config = config;
    this.client = new Client({ auth: config.apiKey });
  }

  /**
   * Create a daily log page
   */
  async createDailyLog(date: Date = new Date()): Promise<string> {
    const dateStr = date.toISOString().split('T')[0];
    const title = `ARI Log - ${dateStr}`;

    const response = await this.client.pages.create({
      parent: { page_id: this.config.dailyLogsPageId },
      properties: {
        title: {
          title: [{ text: { content: title } }],
        },
      },
      children: [
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: 'Morning Briefing' } }],
          },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ text: { content: 'Waiting for briefing...' } }],
          },
        },
        {
          object: 'block',
          type: 'divider',
          divider: {},
        },
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: 'Activity Log' } }],
          },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ text: { content: 'No activity recorded yet.' } }],
          },
        },
        {
          object: 'block',
          type: 'divider',
          divider: {},
        },
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: 'Evening Summary' } }],
          },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ text: { content: 'Waiting for summary...' } }],
          },
        },
      ],
    });

    return response.id;
  }

  /**
   * Add an entry to the daily log
   */
  async addLogEntry(entry: DailyLogEntry, pageId?: string): Promise<void> {
    const targetPageId = pageId ?? this.config.dailyLogsPageId;
    const timestamp = entry.timestamp ?? new Date();
    const timeStr = timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const priorityEmoji = entry.priority
      ? { P0: '🔴', P1: '🟠', P2: '🟡', P3: '🟢', P4: '⚪' }[entry.priority]
      : '';

    const categoryEmoji = {
      briefing: '📋',
      summary: '📊',
      notification: '🔔',
      action: '⚡',
      error: '❌',
    }[entry.category];

    await this.client.blocks.children.append({
      block_id: targetPageId,
      children: [
        {
          object: 'block',
          type: 'callout',
          callout: {
            icon: { emoji: categoryEmoji },
            rich_text: [
              {
                text: {
                  content: `${priorityEmoji} [${timeStr}] ${entry.title}\n${entry.content}`,
                },
              },
            ],
          },
        },
      ],
    });
  }

  /**
   * Add a task to the Tasks database
   */
  async addTask(task: TaskEntry): Promise<string> {
    const properties: Record<string, unknown> = {
      'Task name': {
        title: [{ text: { content: task.name } }],
      },
      Status: {
        status: { name: task.status },
      },
      Priority: {
        select: { name: task.priority },
      },
    };

    if (task.description) {
      properties.Description = {
        rich_text: [{ text: { content: task.description } }],
      };
    }

    if (task.dueDate) {
      properties['Due date'] = {
        date: { start: task.dueDate.toISOString().split('T')[0] },
      };
    }

    const response = await this.client.pages.create({
      parent: { database_id: this.config.tasksDbId },
      properties: properties as Parameters<typeof this.client.pages.create>[0]['properties'],
    });

    return response.id;
  }

  /**
   * Query tasks from the database
   */
  async getTasks(filter?: 'all' | 'pending' | 'completed'): Promise<PageResult[]> {
    // Use the REST API directly for database queries
    const url = `https://api.notion.com/v1/databases/${this.config.tasksDbId}/query`;

    const body: Record<string, unknown> = {
      sorts: [{ property: 'Due date', direction: 'ascending' }],
    };

    if (filter === 'pending') {
      body.filter = {
        property: 'Status',
        status: { does_not_equal: 'Done' },
      };
    } else if (filter === 'completed') {
      body.filter = {
        property: 'Status',
        status: { equals: 'Done' },
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json() as { results: PageResult[] };
    return data.results.filter((page) => page.properties !== undefined);
  }

  /**
   * Update a task's status
   */
  async updateTaskStatus(
    pageId: string,
    status: 'Not started' | 'In progress' | 'Done'
  ): Promise<void> {
    await this.client.pages.update({
      page_id: pageId,
      properties: {
        Status: { status: { name: status } },
      },
    });
  }

  /**
   * Add a notification to the inbox (creates as a block in daily logs if no inbox DB)
   */
  async addNotification(notification: NotificationEntry): Promise<string> {
    if (this.config.inboxDbId) {
      // If we have a dedicated inbox database
      const response = await this.client.pages.create({
        parent: { database_id: this.config.inboxDbId },
        properties: {
          Title: {
            title: [{ text: { content: notification.title } }],
          },
          Category: {
            select: { name: notification.category },
          },
          Priority: {
            select: { name: notification.priority },
          },
          Acknowledged: {
            checkbox: notification.acknowledged ?? false,
          },
        } as Parameters<typeof this.client.pages.create>[0]['properties'],
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ text: { content: notification.body } }],
            },
          },
        ],
      });
      return response.id;
    } else {
      // Fall back to adding to daily logs page
      await this.addLogEntry({
        title: notification.title,
        content: notification.body,
        category: 'notification',
        priority: notification.priority as DailyLogEntry['priority'],
        timestamp: notification.timestamp,
      });
      return 'added-to-daily-log';
    }
  }

  /**
   * Create morning briefing
   */
  async createMorningBriefing(content: {
    weather?: string;
    calendar?: string[];
    tasks?: string[];
    reminders?: string[];
  }): Promise<void> {
    const sections: string[] = [];

    if (content.weather) {
      sections.push(`☀️ Weather: ${content.weather}`);
    }

    if (content.calendar?.length) {
      sections.push(`📅 Today's Schedule:\n${content.calendar.map((e) => `  • ${e}`).join('\n')}`);
    }

    if (content.tasks?.length) {
      sections.push(`✅ Priority Tasks:\n${content.tasks.map((t) => `  • ${t}`).join('\n')}`);
    }

    if (content.reminders?.length) {
      sections.push(`💡 Reminders:\n${content.reminders.map((r) => `  • ${r}`).join('\n')}`);
    }

    await this.addLogEntry({
      title: 'Morning Briefing',
      content: sections.join('\n\n'),
      category: 'briefing',
      priority: 'P2',
    });
  }

  /**
   * Create evening summary
   */
  async createEveningSummary(content: {
    completed?: string[];
    pending?: string[];
    highlights?: string[];
    tomorrow?: string[];
  }): Promise<void> {
    const sections: string[] = [];

    if (content.completed?.length) {
      sections.push(`✅ Completed Today:\n${content.completed.map((c) => `  • ${c}`).join('\n')}`);
    }

    if (content.pending?.length) {
      sections.push(`⏳ Still Pending:\n${content.pending.map((p) => `  • ${p}`).join('\n')}`);
    }

    if (content.highlights?.length) {
      sections.push(`⭐ Highlights:\n${content.highlights.map((h) => `  • ${h}`).join('\n')}`);
    }

    if (content.tomorrow?.length) {
      sections.push(`📋 Tomorrow:\n${content.tomorrow.map((t) => `  • ${t}`).join('\n')}`);
    }

    await this.addLogEntry({
      title: 'Evening Summary',
      content: sections.join('\n\n'),
      category: 'summary',
      priority: 'P3',
    });
  }

  /**
   * Search pages
   */
  async search(query: string): Promise<PageResult[]> {
    const response = await this.client.search({
      query,
      filter: { property: 'object', value: 'page' },
      page_size: 10,
    });

    return response.results
      .filter((page) => 'properties' in page)
      .map((page) => ({
        id: page.id,
        object: page.object,
        properties: 'properties' in page ? (page as { properties: Record<string, unknown> }).properties : undefined,
      }));
  }

  /**
   * Verify connection
   */
  async verify(): Promise<boolean> {
    try {
      await this.client.users.me({});
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Factory function
 */
export function createNotionClient(config: NotionConfig): NotionClient {
  return new NotionClient(config);
}
