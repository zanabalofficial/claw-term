#!/usr/bin/env bun
/**
 * Health Check Script for Docker
 */

async function healthCheck() {
  try {
    const port = process.env.PORT || '3000';
    const response = await fetch(`http://localhost:${port}/health`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'healthy' || data.status === 'degraded') {
        console.log('Health check passed');
        process.exit(0);
      }
    }
    
    console.error('Health check failed');
    process.exit(1);
  } catch (error) {
    console.error('Health check error:', error);
    process.exit(1);
  }
}

healthCheck();
