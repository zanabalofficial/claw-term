#!/usr/bin/env bun
/**
 * ClawTerm Orchestrator - Production Entry Point
 * Run scheduled agents, expose API, manage job queue
 */

import { AgentOrchestrator } from './src/business/AgentOrchestrator';
import { createServer } from './src/api/server';

const orchestrator = new AgentOrchestrator();

// Load jobs from config
async function loadJobs() {
  try {
    const config = await Bun.file(process.env.CLAW_JOBS_CONFIG || './config/jobs.json').json();
    
    for (const jobConfig of config.jobs) {
      orchestrator.schedule({
        agentId: jobConfig.agentId,
        name: jobConfig.name,
        schedule: jobConfig.schedule,
        cronExpression: jobConfig.cronExpression,
        config: jobConfig.config,
        enabled: jobConfig.enabled !== false,
      });
      console.log(`Scheduled: ${jobConfig.name} (${jobConfig.schedule})`);
    }
    
    console.log(`Loaded ${config.jobs.length} jobs`);
  } catch (error) {
    console.log('No jobs config found, starting with empty schedule');
  }
}

// Event logging
orchestrator.on('job:started', ({ jobId, agentId }) => {
  console.log(`[${new Date().toISOString()}] Job started: ${jobId} (${agentId})`);
});

orchestrator.on('job:completed', (result) => {
  console.log(`[${new Date().toISOString()}] Job completed: ${result.jobId}`);
  console.log(`  Revenue impact: $${result.revenueImpact || 0}`);
  console.log(`  Fee: $${result.fee || 0}`);
});

orchestrator.on('job:failed', (result) => {
  console.error(`[${new Date().toISOString()}] Job failed: ${result.jobId}`);
  console.error(`  Error: ${result.error}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  orchestrator.stopAll();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  orchestrator.stopAll();
  process.exit(0);
});

// Start
async function main() {
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║     ClawTerm Business Agent Orchestrator          ║');
  console.log('║     30 Revenue Agents • Production Ready          ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log();

  await loadJobs();
  
  // Start API server
  const server = createServer(orchestrator);
  const port = parseInt(process.env.PORT || '3000');
  
  server.listen(port, () => {
    console.log(`API server listening on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
    console.log(`Metrics: http://localhost:${port}/metrics`);
  });

  // Print stats periodically
  setInterval(() => {
    const stats = orchestrator.getStats();
    console.log();
    console.log('📊 Orchestrator Stats');
    console.log(`   Jobs: ${stats.activeJobs}/${stats.totalJobs} active`);
    console.log(`   Runs: ${stats.totalRuns} total`);
    console.log(`   Revenue: $${stats.totalRevenue.toFixed(2)} generated`);
    console.log(`   Fees: $${stats.totalFees.toFixed(2)} earned`);
    console.log(`   Success rate: ${(stats.successRate * 100).toFixed(1)}%`);
  }, 60000); // Every minute
}

main().catch(console.error);
