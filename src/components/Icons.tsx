'use client';

import type { ReactNode } from 'react';

type IconType = 'dawn' | 'morning' | 'sun' | 'cookie' | 'moon' | 'wait' | 'info-bold';

interface IconProps {
    name: IconType;
    className?: string;
}

export function Icon({ name, className = '' }: IconProps): ReactNode {
    const baseClass = `picto-svg ${className}`;

    switch (name) {
        case 'dawn':
            return (
                <svg className={baseClass} viewBox="0 0 24 24" style={{ width: 18, height: 18, stroke: 'currentColor', strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                    <circle cx="12" cy="13" r="8" />
                    <path d="M12 9v4l2 2" />
                    <path d="M5 3L2 6" />
                    <path d="M22 6L19 3" />
                </svg>
            );
        case 'morning':
            return (
                <svg className={baseClass} viewBox="0 0 24 24" style={{ width: 18, height: 18, stroke: 'currentColor', strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                    <line x1="6" y1="1" x2="6" y2="4" />
                    <line x1="10" y1="1" x2="10" y2="4" />
                    <line x1="14" y1="1" x2="14" y2="4" />
                </svg>
            );
        case 'sun':
            return (
                <svg className={baseClass} viewBox="0 0 24 24" style={{ width: 18, height: 18, stroke: 'currentColor', strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
            );
        case 'cookie':
            return (
                <svg className={baseClass} viewBox="0 0 24 24" style={{ width: 18, height: 18, stroke: 'currentColor', strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                    <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
                    <path d="M8.5 8.5h.01" />
                    <path d="M16 15h.01" />
                    <path d="M9 16h.01" />
                </svg>
            );
        case 'moon':
            return (
                <svg className={baseClass} viewBox="0 0 24 24" style={{ width: 18, height: 18, stroke: 'currentColor', strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
            );
        case 'wait':
            return (
                <svg className={baseClass} viewBox="0 0 24 24" style={{ width: 18, height: 18, stroke: 'currentColor', strokeWidth: 2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                    <path d="M5 2h14M5 22h14M12 12l5-5V4H7v3l5 5zm0 0l-5 5v3h10v-3l-5-5z" />
                </svg>
            );
        case 'info-bold':
            return (
                <svg className="info-circle-icon" viewBox="0 0 24 24" style={{ width: 18, height: 18, stroke: '#ffffff', strokeWidth: 2.5, fill: 'none' }}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 12v5" strokeWidth={3} strokeLinecap="round" />
                    <circle cx="12" cy="8" r="1.5" fill="currentColor" stroke="none" />
                </svg>
            );
        default:
            return null;
    }
}
