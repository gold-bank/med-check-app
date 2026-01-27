'use client';

import { Icon } from './Icons';

export function AlertSection() {
    return (
        <div className="alerts-container">
            <div className="alert-title-main">
                <Icon name="info-bold" />
                핵심 주간 루틴(Weekly Critical Routine)
            </div>
            <div className="alert-cards-wrapper">
                <div className="alert-card">
                    <div className="alert-header">
                        <span className="alert-badge">월요일</span>
                        MTX (6알) 복용일
                    </div>
                    <div className="alert-content">
                        MTX는 신장으로 배설되어 수분 섭취가 중요합니다.
                        <br />
                        <span className="alert-highlight-text">
                            ✔ 월요일 저녁 ~ 화요일 오전:
                        </span>
                        <span className="alert-sub-text">
                            평소보다 물 2~3컵 더 드세요. (신장 수치 관리 비결)
                        </span>
                    </div>
                </div>
                <div className="alert-card">
                    <div className="alert-header">
                        <span className="alert-badge">화요일</span>
                        엽산 복용 시간 변경
                    </div>
                    <div className="alert-content">
                        MTX 복용후 24시간 이내 엽산 X
                        <br />
                        <span className="alert-highlight-text">
                            ✔ 화요일 아침 복용 금지
                        </span>
                        <span className="alert-sub-text">
                            ➔ 화요일 저녁에 복용하세요!
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
