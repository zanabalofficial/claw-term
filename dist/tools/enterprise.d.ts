/**
 * Enterprise Connectors - Drive, Notion, Slack, GitHub, Jira, etc.
 * Unified interface for enterprise tools
 */
export interface EnterpriseConnection {
    provider: 'github' | 'slack' | 'notion' | 'jira' | 'drive' | 'confluence' | 'linear';
    token: string;
    workspace?: string;
    baseUrl?: string;
}
export declare class EnterpriseConnectors {
    private connections;
    register(name: string, config: EnterpriseConnection): void;
    github(connectionName: string, operation: string, args: any): Promise<any>;
    private execGh;
    slack(connectionName: string, operation: string, args: any): Promise<any>;
    notion(connectionName: string, operation: string, args: any): Promise<any>;
    jira(connectionName: string, operation: string, args: any): Promise<any>;
    linear(connectionName: string, operation: string, args: any): Promise<any>;
    api(connectionName: string, endpoint: string, options?: {
        method?: string;
        body?: any;
        headers?: Record<string, string>;
    }): Promise<any>;
}
export default EnterpriseConnectors;
