/**
 * ARI Knowledge Sources
 *
 * Curated whitelist of verified, authoritative sources for AI knowledge.
 * Each source is carefully selected for:
 * - Official/authoritative status
 * - Technical accuracy
 * - Safety (no user-generated content that could inject prompts)
 * - Relevance to ARI's growth
 *
 * Categories:
 * - OFFICIAL: Direct from creators/maintainers
 * - RESEARCH: Peer-reviewed or established research institutions
 * - DOCUMENTATION: Official technical documentation
 */

export type SourceCategory = 'OFFICIAL' | 'RESEARCH' | 'DOCUMENTATION';
export type SourceTrust = 'verified' | 'standard';

export interface KnowledgeSource {
  id: string;
  name: string;
  url: string;
  category: SourceCategory;
  trust: SourceTrust;
  description: string;
  fetchPath?: string; // Specific path to fetch (for APIs)
  contentType: 'html' | 'json' | 'markdown' | 'rss';
  updateFrequency: 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
}

/**
 * Verified whitelist of knowledge sources
 *
 * Selection criteria:
 * 1. Must be an official source (company docs, academic institution, established org)
 * 2. No user-generated content (forums, social media, comments)
 * 3. Technical focus - AI, programming, security
 * 4. HTTPS only
 * 5. No paywalls that require credentials
 */
export const KNOWLEDGE_SOURCES: KnowledgeSource[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // ANTHROPIC - Primary source for Claude knowledge
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'anthropic-docs',
    name: 'Anthropic Documentation',
    url: 'https://docs.anthropic.com',
    category: 'OFFICIAL',
    trust: 'verified',
    description: 'Official Claude API documentation from Anthropic',
    contentType: 'html',
    updateFrequency: 'weekly',
    enabled: true,
  },
  {
    id: 'anthropic-cookbook',
    name: 'Anthropic Cookbook',
    url: 'https://github.com/anthropics/anthropic-cookbook',
    category: 'OFFICIAL',
    trust: 'verified',
    description: 'Official code examples and best practices from Anthropic',
    fetchPath: '/blob/main/README.md',
    contentType: 'markdown',
    updateFrequency: 'weekly',
    enabled: true,
  },
  {
    id: 'anthropic-courses',
    name: 'Anthropic Courses',
    url: 'https://github.com/anthropics/courses',
    category: 'OFFICIAL',
    trust: 'verified',
    description: 'Official educational content from Anthropic',
    contentType: 'markdown',
    updateFrequency: 'monthly',
    enabled: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AI RESEARCH - Academic and established research organizations
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'arxiv-cs-ai',
    name: 'arXiv CS.AI',
    url: 'https://arxiv.org/list/cs.AI/recent',
    category: 'RESEARCH',
    trust: 'verified',
    description: 'Peer-reviewed AI research papers (titles/abstracts only)',
    contentType: 'html',
    updateFrequency: 'daily',
    enabled: true,
  },
  {
    id: 'arxiv-cs-cl',
    name: 'arXiv CS.CL',
    url: 'https://arxiv.org/list/cs.CL/recent',
    category: 'RESEARCH',
    trust: 'verified',
    description: 'Computational linguistics and NLP research',
    contentType: 'html',
    updateFrequency: 'daily',
    enabled: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TECHNICAL DOCUMENTATION - Official docs from key technologies
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'nodejs-docs',
    name: 'Node.js Documentation',
    url: 'https://nodejs.org/docs/latest/api/',
    category: 'DOCUMENTATION',
    trust: 'verified',
    description: 'Official Node.js API documentation',
    contentType: 'html',
    updateFrequency: 'monthly',
    enabled: true,
  },
  {
    id: 'typescript-docs',
    name: 'TypeScript Documentation',
    url: 'https://www.typescriptlang.org/docs/',
    category: 'DOCUMENTATION',
    trust: 'verified',
    description: 'Official TypeScript language documentation',
    contentType: 'html',
    updateFrequency: 'monthly',
    enabled: true,
  },
  {
    id: 'mdn-web-docs',
    name: 'MDN Web Docs',
    url: 'https://developer.mozilla.org/en-US/docs/Web',
    category: 'DOCUMENTATION',
    trust: 'verified',
    description: 'Mozilla Developer Network - authoritative web standards reference',
    contentType: 'html',
    updateFrequency: 'weekly',
    enabled: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SECURITY - OWASP and security best practices
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'owasp-top10',
    name: 'OWASP Top 10',
    url: 'https://owasp.org/www-project-top-ten/',
    category: 'DOCUMENTATION',
    trust: 'verified',
    description: 'OWASP security vulnerabilities reference',
    contentType: 'html',
    updateFrequency: 'monthly',
    enabled: true,
  },
  {
    id: 'owasp-llm-top10',
    name: 'OWASP LLM Top 10',
    url: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/',
    category: 'DOCUMENTATION',
    trust: 'verified',
    description: 'OWASP security risks specific to LLM applications',
    contentType: 'html',
    updateFrequency: 'monthly',
    enabled: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AI SAFETY - Alignment and safety research
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'alignment-forum',
    name: 'AI Alignment Forum',
    url: 'https://www.alignmentforum.org/',
    category: 'RESEARCH',
    trust: 'standard', // Contains user posts, requires extra filtering
    description: 'AI safety and alignment research discussions',
    contentType: 'html',
    updateFrequency: 'weekly',
    enabled: false, // Disabled by default - user content requires review
  },
];

/**
 * Get enabled sources by category
 */
export function getSourcesByCategory(category: SourceCategory): KnowledgeSource[] {
  return KNOWLEDGE_SOURCES.filter(s => s.enabled && s.category === category);
}

/**
 * Get all enabled sources
 */
export function getEnabledSources(): KnowledgeSource[] {
  return KNOWLEDGE_SOURCES.filter(s => s.enabled);
}

/**
 * Get only verified (highest trust) sources
 */
export function getVerifiedSources(): KnowledgeSource[] {
  return KNOWLEDGE_SOURCES.filter(s => s.enabled && s.trust === 'verified');
}

/**
 * Validate a URL against the whitelist
 */
export function isWhitelistedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return KNOWLEDGE_SOURCES.some(source => {
      const sourceUrl = new URL(source.url);
      return parsed.hostname === sourceUrl.hostname && source.enabled;
    });
  } catch {
    return false;
  }
}
