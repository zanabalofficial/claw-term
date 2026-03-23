import React from 'react';
import { Session } from '../core/SessionManager';
import { Config } from '../core/ConfigManager';
interface StatusBarProps {
    session: Session;
    config: Config;
    isStreaming: boolean;
    toolCount: number;
}
export declare const StatusBar: React.FC<StatusBarProps>;
export {};
