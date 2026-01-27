'use client';

import { useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiProps {
    trigger: boolean;
}

function randomInRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

export function Confetti({ trigger }: ConfettiProps) {
    const fireConfetti = useCallback(() => {
        if (typeof window !== 'undefined' && confetti) {
            confetti({
                angle: randomInRange(55, 125),
                spread: randomInRange(50, 70),
                particleCount: randomInRange(50, 100),
                origin: { y: 0.6 },
            });
        }
    }, []);

    useEffect(() => {
        if (trigger) {
            fireConfetti();
        }
    }, [trigger, fireConfetti]);

    return null;
}
