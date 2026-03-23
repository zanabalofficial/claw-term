/**
 * API Server for Orchestrator
 * REST API and webhook endpoints for external integration
 */
import { AgentOrchestrator } from '../business/AgentOrchestrator';
export declare function createServer(orchestrator: AgentOrchestrator): Bun.Server<undefined>;
export default createServer;
