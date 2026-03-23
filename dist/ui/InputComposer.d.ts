import React from 'react';
interface InputComposerProps {
    onSubmit: (content: string) => void;
    disabled?: boolean;
    isLoading?: boolean;
    placeholder?: string;
}
export declare const InputComposer: React.FC<InputComposerProps>;
export {};
