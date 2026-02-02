/**
 * Commitlint Configuration
 *
 * Enforces conventional commit format for ARI repository.
 * Part of Operation Clarity Protocol.
 *
 * @see https://www.conventionalcommits.org/
 * @see https://commitlint.js.org/
 */

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type must be one of the following
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation only
        'style',    // Formatting, no code change
        'refactor', // Code change that neither fixes a bug nor adds a feature
        'perf',     // Performance improvement
        'test',     // Adding or correcting tests
        'build',    // Build system or external dependencies
        'ci',       // CI configuration
        'chore',    // Other changes that don't modify src or test
        'revert',   // Revert a previous commit
        'merge',    // Merge commits (for history integration)
        'ops',      // Operations/deployment changes
      ],
    ],
    // Scope is optional but recommended
    'scope-enum': [
      1,
      'always',
      [
        'cognition',  // Cognitive Layer 0 (LOGOS/ETHOS/PATHOS)
        'kernel',     // Kernel layer (gateway, sanitizer, audit, event-bus)
        'system',     // System layer (router, storage)
        'agents',     // Agent layer (core, guardian, planner, executor, memory)
        'governance', // Governance layer (council, arbiter, overseer)
        'autonomous', // Autonomous operations (scheduler, briefings, knowledge)
        'api',        // REST API and WebSocket
        'cli',        // CLI commands
        'dashboard',  // Web dashboard
        'ops',        // Operations (daemon, launchd)
        'docs',       // Documentation
        'deps',       // Dependencies
        'repo',       // Repository configuration
        'changelog',  // CHANGELOG updates
        'learning',   // Learning loop and self-improvement
        'knowledge',  // Knowledge sources and validation
      ],
    ],
    // Subject must not be empty
    'subject-empty': [2, 'never'],
    // Subject must not end with period
    'subject-full-stop': [2, 'never', '.'],
    // Subject must be sentence case (first letter lowercase)
    'subject-case': [2, 'always', 'lower-case'],
    // Header must be 100 characters or less
    'header-max-length': [2, 'always', 100],
    // Body must have blank line before it
    'body-leading-blank': [2, 'always'],
    // Footer must have blank line before it
    'footer-leading-blank': [2, 'always'],
  },
};
