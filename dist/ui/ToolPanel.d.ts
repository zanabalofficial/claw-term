import React from 'react';
interface ToolPanelProps {
    onSelectTool: (tool: string | null) => void;
    activeTool: string | null;
}
export declare const ToolPanel: React.FC<ToolPanelProps>;
export {};
