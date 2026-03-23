// @ts-nocheck
/**
 * API Server for Orchestrator
 * REST API and webhook endpoints for external integration
 */
export function createServer(orchestrator) {
    return Bun.serve({
        port: parseInt(process.env.PORT || '3000'),
        async fetch(request) {
            const url = new URL(request.url);
            const path = url.pathname;
            const method = request.method;
            // Health check
            if (path === '/health') {
                const health = orchestrator.healthCheck();
                return Response.json({
                    healthStatus: health.status,
                    timestamp: new Date().toISOString(),
                    version: '2.0.0',
                    activeJobs: health.activeJobs,
                    failedRuns: health.failedRuns,
                    last24h: health.last24h,
                });
            }
            // Metrics
            if (path === '/metrics') {
                const stats = orchestrator.getStats();
                return Response.json(stats);
            }
            // List all jobs
            if (path === '/jobs' && method === 'GET') {
                return Response.json(orchestrator.getAllJobs());
            }
            // Get specific job
            if (path.startsWith('/jobs/') && method === 'GET') {
                const jobId = path.split('/')[2];
                const job = orchestrator.getJob(jobId);
                if (!job)
                    return new Response('Not found', { status: 404 });
                return Response.json(job);
            }
            // Create job
            if (path === '/jobs' && method === 'POST') {
                const body = await request.json();
                const job = orchestrator.schedule(body);
                return Response.json(job, { status: 201 });
            }
            // Execute job immediately
            if (path.startsWith('/jobs/') && path.endsWith('/execute') && method === 'POST') {
                const jobId = path.split('/')[2];
                try {
                    const result = await orchestrator.executeJob(jobId);
                    return Response.json(result);
                }
                catch (error) {
                    return Response.json({ error: error.message }, { status: 500 });
                }
            }
            // Enable/disable job
            if (path.startsWith('/jobs/') && path.endsWith('/toggle') && method === 'POST') {
                const jobId = path.split('/')[2];
                const job = orchestrator.getJob(jobId);
                if (!job)
                    return new Response('Not found', { status: 404 });
                orchestrator.setJobEnabled(jobId, !job.enabled);
                return Response.json({ enabled: !job.enabled });
            }
            // Delete job
            if (path.startsWith('/jobs/') && method === 'DELETE') {
                const jobId = path.split('/')[2];
                orchestrator.deleteJob(jobId);
                return new Response(null, { status: 204 });
            }
            // Get job history
            if (path.startsWith('/jobs/') && path.endsWith('/history') && method === 'GET') {
                const jobId = path.split('/')[2];
                const limit = parseInt(url.searchParams.get('limit') || '100');
                return Response.json(orchestrator.getJobHistory(jobId, limit));
            }
            // Run all enabled jobs
            if (path === '/run-all' && method === 'POST') {
                try {
                    const results = await orchestrator.runAll();
                    return Response.json(results);
                }
                catch (error) {
                    return Response.json({ error: error.message }, { status: 500 });
                }
            }
            // Webhook for triggering agents
            if (path === '/webhook' && method === 'POST') {
                const body = await request.json();
                const agentId = body.agentId;
                const config = body.config;
                try {
                    // Create temporary job and run immediately
                    const job = orchestrator.schedule({
                        agentId,
                        name: `webhook-${Date.now()}`,
                        schedule: 'daily', // Won't run on schedule
                        config,
                        enabled: false, // Don't schedule
                    });
                    const result = await orchestrator.executeJob(job.id);
                    // Clean up temp job
                    orchestrator.deleteJob(job.id);
                    return Response.json(result);
                }
                catch (error) {
                    return Response.json({ error: error.message }, { status: 500 });
                }
            }
            // Get agent scores (from selector)
            if (path === '/agents/scores' && method === 'GET') {
                const { AgentSelector } = await import('../business/AgentSelector');
                const selector = new AgentSelector();
                return Response.json(selector.scoreAll());
            }
            // 404
            return new Response('Not found', { status: 404 });
        },
    });
}
export default createServer;
