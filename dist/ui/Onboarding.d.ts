/**
 * Interactive Onboarding System
 * Guides users through first-time setup
 */
import React from 'react';
interface OnboardingProps {
    onComplete: (config: Record<string, any>) => void;
    onSkip?: () => void;
}
export declare const InteractiveOnboarding: React.FC<OnboardingProps>;
export default InteractiveOnboarding;
