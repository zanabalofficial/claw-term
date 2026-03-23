import React from 'react';
import { Message } from '../core/SessionManager';
interface MessageListProps {
    messages: Message[];
    isStreaming: boolean;
    maxHeight: number;
}
export declare const MessageList: React.FC<MessageListProps>;
export {};
