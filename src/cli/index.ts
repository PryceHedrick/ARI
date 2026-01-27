#!/usr/bin/env node
import { Command } from 'commander';
import { registerGatewayCommand } from './commands/gateway.js';
import { registerAuditCommand } from './commands/audit.js';
import { registerDoctorCommand } from './commands/doctor.js';
import { registerOnboardCommand } from './commands/onboard.js';

const program = new Command();

program
  .name('ari')
  .description('ARI — Artificial Reasoning Intelligence V12.0')
  .version('12.0.0');

registerGatewayCommand(program);
registerAuditCommand(program);
registerDoctorCommand(program);
registerOnboardCommand(program);

program.parse();
