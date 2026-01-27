'use client';

interface MedicineItemProps {
    id: string;
    name: string;
    dose: string;
    checked: boolean;
    disabled?: boolean;
    isActiveToday?: boolean;
    isDanger?: boolean;
    badge?: string;
    dayBadge?: string;
    showFolicWarning?: boolean;
    forceWrap?: boolean;
    onChange: (id: string, checked: boolean) => void;
}

export function MedicineItem({
    id,
    name,
    dose,
    checked,
    disabled = false,
    isActiveToday = false,
    isDanger = false,
    badge,
    dayBadge,
    showFolicWarning = false,
    forceWrap = false,
    onChange,
}: MedicineItemProps) {
    const handleClick = () => {
        if (!disabled) {
            onChange(id, !checked);
        }
    };

    const wrapperClasses = [
        disabled ? 'med-disabled' : '',
        !disabled && isActiveToday ? 'med-active-today' : '',
        !disabled && isDanger ? 'med-active-danger' : '',
    ].filter(Boolean).join(' ');

    const labelClasses = [
        'med-item-label',
        checked && !disabled ? 'checked' : '',
    ].filter(Boolean).join(' ');

    return (
        <div className={wrapperClasses}>
            <div
                className={labelClasses}
                onClick={handleClick}
                role="checkbox"
                aria-checked={checked}
                aria-disabled={disabled}
                tabIndex={disabled ? -1 : 0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleClick();
                    }
                }}
            >
                <div className="check-circle" />
                <div className={`med-text-wrapper ${forceWrap ? 'force-wrap' : ''}`}>
                    <span className="med-name">
                        {name}
                        {dayBadge && <span className="day-badge">{dayBadge}</span>}
                        {' '}
                        {badge && <span className="d-day-badge">{badge}</span>}
                    </span>
                    <span className="med-dose">
                        {dose}
                        {showFolicWarning && (
                            <span className="folic-warning">★화요일은 저녁 복용★</span>
                        )}
                    </span>
                </div>
            </div>
        </div>
    );
}
