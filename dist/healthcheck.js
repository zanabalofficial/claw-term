#!/usr/bin/env bun
// @ts-nocheck
/**
 * Health Check Script for Docker
 */
async function healthCheck() {
    try {
        const port = process.env.PORT || '3000';
        const response = await fetch(`http://localhost:${port}/health`);
        const data = await response.json();
        if (data.status === 'healthy') {
            console.log('✓ Health check passed');
            process.exit(0);
        }
        else {
            console.log('✗ Health check failed:', data);
            process.exit(1);
        }
    }
    catch (error) {
        console.log('✗ Health check error:', error.message);
        process.exit(1);
    }
}
healthCheck();
