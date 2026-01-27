'use client';

interface MedicineItemProps {
    id: string;
    name: string;
    dose: string;
    checked: boolean;
    disabled?: boolean;
    isActiveToday?: boolean;  // D3 활성일
    isDanger?: boolean;       // MTX 활성일
    badge?: string;           // D-Day 뱃지 (TODAY, D-1, D-2 등)
    dayBadge?: string;        // 요일 뱃지 (월요일 등)
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
        !disabled && !checked && isActiveToday ? 'med-active-today' : '',
        !disabled && !checked && isDanger ? 'med-active-danger' : '',
    ].filter(Boolean).join(' ');

    const labelClasses = [
        'med-item-label',
        checked && !disabled ? 'checked' : '',
    ].filter(Boolean).join(' ');

    // 스마트 뱃지 색상 로직
    // 비활성(disabled) 또는 체크됨(checked) → 회색
    // 활성이면서 체크 안됨 → D3는 오렌지, MTX는 빨간색
    const shouldBadgeBeGray = disabled || checked;

    const getDayBadgeClass = () => {
        if (shouldBadgeBeGray) return 'day-badge badge-gray';
        if (isDanger) return 'day-badge badge-danger';
        return 'day-badge badge-gray';
    };

    const getDDayBadgeClass = () => {
        if (shouldBadgeBeGray) return 'd-day-badge badge-gray';
        if (isDanger) return 'd-day-badge badge-danger';
        if (isActiveToday) return 'd-day-badge badge-active';
        return 'd-day-badge badge-gray';
    };

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
                        {dayBadge && <span className={getDayBadgeClass()}>{dayBadge}</span>}
                        {' '}
                        {badge && <span className={getDDayBadgeClass()}>{badge}</span>}
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
