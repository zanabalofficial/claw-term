/**
 * Slash Command System with Dropdown Menu
 * Quick access to all features via /commands
 */
import React from 'react';
export interface SlashCommand {
    id: string;
    name: string;
    description: string;
    category: 'agent' | 'tool' | 'config' | 'help';
    shortcut?: string;
    action: () => void;
}
interface SlashCommandMenuProps {
    query: string;
    onSelect: (command: SlashCommand) => void;
    onCancel: () => void;
    visible: boolean;
}
export declare const SlashCommandMenu: React.FC<SlashCommandMenuProps>;
export declare const useSlashCommand: (input: string) => {
    isSlashCommand: boolean;
    query: string;
    showMenu: boolean;
};
export default SlashCommandMenu;
