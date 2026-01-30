import { describe, it, expect } from 'vitest';
import { join } from 'path';
import { homedir } from 'os';

// Test the exported functions and types
import { getLogPaths, getDaemonStatus } from '../../../src/ops/daemon.js';

describe('Daemon', () => {
  describe('getLogPaths()', () => {
    it('should return correct log paths', () => {
      const paths = getLogPaths();

      expect(paths).toHaveProperty('stdout');
      expect(paths).toHaveProperty('stderr');
      expect(paths.stdout).toContain('.ari/logs/gateway-stdout.log');
      expect(paths.stderr).toContain('.ari/logs/gateway-stderr.log');
    });

    it('should use home directory', () => {
      const paths = getLogPaths();
      const home = homedir();

      expect(paths.stdout).toContain(home);
      expect(paths.stderr).toContain(home);
    });
  });

  describe('getDaemonStatus()', () => {
    it('should return status object with correct shape', async () => {
      const status = await getDaemonStatus();

      expect(status).toHaveProperty('installed');
      expect(status).toHaveProperty('running');
      expect(status).toHaveProperty('plistPath');
      expect(typeof status.installed).toBe('boolean');
      expect(typeof status.running).toBe('boolean');
      expect(typeof status.plistPath).toBe('string');
    });

    it('should return plist path in LaunchAgents', async () => {
      const status = await getDaemonStatus();

      expect(status.plistPath).toContain('Library/LaunchAgents');
      expect(status.plistPath).toContain('com.ari.gateway.plist');
    });
  });

  describe('Daemon configuration', () => {
    it('should use standard ARI paths', () => {
      const paths = getLogPaths();
      const home = homedir();
      const expectedLogDir = join(home, '.ari', 'logs');

      expect(paths.stdout).toBe(join(expectedLogDir, 'gateway-stdout.log'));
      expect(paths.stderr).toBe(join(expectedLogDir, 'gateway-stderr.log'));
    });

    it('should use com.ari.gateway label', async () => {
      const status = await getDaemonStatus();
      expect(status.plistPath).toContain('com.ari.gateway');
    });
  });

  describe('Type exports', () => {
    it('should export DaemonOptions interface', async () => {
      // Import the types
      const mod = await import('../../../src/ops/daemon.js');

      // Verify function exists and has expected signature
      expect(typeof mod.installDaemon).toBe('function');
      expect(typeof mod.uninstallDaemon).toBe('function');
      expect(typeof mod.getDaemonStatus).toBe('function');
      expect(typeof mod.getLogPaths).toBe('function');
    });
  });
});
