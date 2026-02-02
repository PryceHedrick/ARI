# Integrations Layer

External service integrations for ARI.

## Components

| Integration | Purpose | Files |
|-------------|---------|-------|
| Notion | Task and document management | notion/ |
| SMS | Mobile notifications | sms/ |
| Cowork | Claude Cowork plugins | cowork/ |

## Notion Integration

```typescript
import { NotionClient } from './integrations/notion';

const notion = new NotionClient(process.env.NOTION_API_KEY);
await notion.createPage({ title: 'ARI Task', content: '...' });
```

## SMS Integration

```typescript
import { SMSConversation } from './integrations/sms';

const sms = new SMSConversation(config);
await sms.start();
sms.on('command', (cmd) => handleCommand(cmd));
```

## Cowork Plugin System

Generate Claude Cowork compatible plugins:
```typescript
import { generatePlugin } from './integrations/cowork';

await generatePlugin({
  name: 'ari-tasks',
  tools: ['create_task', 'list_tasks'],
});
```

## Security

- API keys stored in environment variables
- All integrations log to audit trail
- Trust levels propagated to external calls

Skills: `/ari-cowork-plugin`
