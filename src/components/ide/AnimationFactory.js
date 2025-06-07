import React from 'react';

// 🎨 임시 플레이스홀더 컴포넌트 (파일이 없을 경우 대비)
const FallbackPlaceholder = ({ type = 'unknown', data = null, currentStep = 0, totalSteps = 0 }) => (
    <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        backgroundColor: '#ffffff',
        border: '2px dashed #e2e8f0',
        borderRadius: '12px',
        textAlign: 'center',
        minHeight: '400px'
    }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🚧</div>
        <h3 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>
            {type} 애니메이션 개발 중
        </h3>
        <p style={{ margin: '0 0 20px 0', color: '#64748b' }}>
            곧 완성될 예정입니다!
        </p>
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '12px',
            width: '100%',
            maxWidth: '400px',
            marginTop: '20px'
        }}>
            <div style={{
                padding: '12px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
            }}>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>현재 단계</div>
                <div style={{ fontSize: '14px', color: '#8b5cf6', fontWeight: 'bold' }}>
                    {currentStep + 1} / {totalSteps}
                </div>
            </div>
            <div style={{
                padding: '12px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
            }}>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>애니메이션</div>
                <div style={{ fontSize: '14px', color: '#8b5cf6', fontWeight: 'bold' }}>{type}</div>
            </div>
        </div>
    </div>
);

// PlaceholderAnimation import 시도 (실패시 FallbackPlaceholder 사용)
let PlaceholderAnimation;
try {
    PlaceholderAnimation = require('./animations/PlaceholderAnimation').default;
} catch (error) {
    console.warn('PlaceholderAnimation 컴포넌트를 불러올 수 없습니다. Fallback을 사용합니다.', error);
    PlaceholderAnimation = FallbackPlaceholder;
}

/**
 * 🏭 AnimationFactory 클래스 (임시 개발 버전)
 * 실제 애니메이션 컴포넌트가 준비되면 교체될 예정
 */
export class AnimationFactory {
    // 📋 애니메이션 타입 → 컴포넌트 매핑 테이블 (모두 플레이스홀더)
    static animations = {
        // 🔄 재귀 애니메이션들
        'fibonacci-recursion': PlaceholderAnimation,
        'factorial-recursion': PlaceholderAnimation,
        'hanoi-tower': PlaceholderAnimation,
        'recursion-tree': PlaceholderAnimation,

        // 🔢 정렬 애니메이션들
        'bubble-sort': PlaceholderAnimation,
        'quick-sort': PlaceholderAnimation,
        'merge-sort': PlaceholderAnimation,
        'insertion-sort': PlaceholderAnimation,
        'selection-sort': PlaceholderAnimation,
        'heap-sort': PlaceholderAnimation,

        // 📊 자료구조 애니메이션들
        'array': PlaceholderAnimation,
        'array-manipulation': PlaceholderAnimation,
        'linked-list': PlaceholderAnimation,
        'stack': PlaceholderAnimation,
        'queue': PlaceholderAnimation,
        'tree': PlaceholderAnimation,
        'binary-tree': PlaceholderAnimation,
        'bst': PlaceholderAnimation,

        // 🔍 탐색 애니메이션들
        'binary-search': PlaceholderAnimation,
        'linear-search': PlaceholderAnimation,
        'breadth-first-search': PlaceholderAnimation,
        'depth-first-search': PlaceholderAnimation,
        'bfs': PlaceholderAnimation,
        'dfs': PlaceholderAnimation,

        // 📝 변수 추적 애니메이션들
        'variables': PlaceholderAnimation,
        'variable-tracking': PlaceholderAnimation,
        'basic-algorithm': PlaceholderAnimation,

        // 🎯 기본 애니메이션 (fallback)
        'default': PlaceholderAnimation,
        'unknown': PlaceholderAnimation
    };

    // 📚 애니메이션 카테고리별 분류
    static categories = {
        recursion: [
            'fibonacci-recursion', 'factorial-recursion',
            'hanoi-tower', 'recursion-tree'
        ],
        sorting: [
            'bubble-sort', 'quick-sort', 'merge-sort',
            'insertion-sort', 'selection-sort', 'heap-sort'
        ],
        dataStructures: [
            'array', 'array-manipulation', 'linked-list',
            'stack', 'queue', 'tree', 'binary-tree', 'bst'
        ],
        searching: [
            'binary-search', 'linear-search', 'breadth-first-search',
            'depth-first-search', 'bfs', 'dfs'
        ],
        variables: [
            'variables', 'variable-tracking', 'basic-algorithm'
        ]
    };

    /**
     * 🎨 애니메이션 컴포넌트 생성
     * @param {string} type - 애니메이션 타입
     * @param {Object} props - 컴포넌트에 전달할 props
     * @returns {React.Component} 생성된 애니메이션 컴포넌트
     */
    static createAnimation(type, props = {}) {
        console.log(`🏭 Creating animation: ${type} (개발 중 버전)`);
        console.log('Props:', props);

        // 1. 애니메이션 타입 정규화
        const normalizedType = this.normalizeType(type);
        console.log('Normalized type:', normalizedType);

        // 2. 컴포넌트 찾기 (현재는 모두 플레이스홀더)
        const AnimationComponent = this.animations[normalizedType] || PlaceholderAnimation;
        console.log('Selected component:', AnimationComponent);

        // 3. 컴포넌트 생성 및 반환
        const element = React.createElement(AnimationComponent, {
            key: `animation-${normalizedType}-${Date.now()}`,
            type: normalizedType,
            animationType: normalizedType,
            ...props
        });

        console.log('Created element:', element);
        return element;
    }

    /**
     * 🔧 애니메이션 타입 정규화
     * @param {string} type - 원본 타입
     * @returns {string} 정규화된 타입
     */
    static normalizeType(type) {
        if (!type) return 'unknown';

        // 소문자로 변환하고 공백/언더스코어를 하이픈으로 변환
        return type.toLowerCase()
            .replace(/[\s_]+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
    }

    /**
     * 📋 사용 가능한 애니메이션 타입 목록
     * @returns {Array} 애니메이션 타입 배열
     */
    static getAvailableTypes() {
        return Object.keys(this.animations).filter(type =>
            type !== 'unknown' && type !== 'default'
        );
    }

    /**
     * 🏷️ 애니메이션 타입이 유효한지 확인
     * @param {string} type - 확인할 타입
     * @returns {boolean} 유효성 여부
     */
    static isValidType(type) {
        const normalizedType = this.normalizeType(type);
        return normalizedType in this.animations;
    }

    /**
     * 📂 카테고리별 애니메이션 타입 조회
     * @param {string} category - 카테고리명
     * @returns {Array} 해당 카테고리의 애니메이션 타입들
     */
    static getTypesByCategory(category) {
        return this.categories[category] || [];
    }

    /**
     * 🔍 애니메이션 타입의 카테고리 찾기
     * @param {string} type - 애니메이션 타입
     * @returns {string|null} 카테고리명
     */
    static getCategoryByType(type) {
        const normalizedType = this.normalizeType(type);

        for (const [category, types] of Object.entries(this.categories)) {
            if (types.includes(normalizedType)) {
                return category;
            }
        }
        return null;
    }

    /**
     * 🎯 새로운 애니메이션 타입 등록 (실제 컴포넌트 완성 후 사용)
     * @param {string} type - 애니메이션 타입
     * @param {React.Component} component - 컴포넌트
     * @param {string} category - 카테고리 (선택사항)
     */
    static registerAnimation(type, component, category = null) {
        const normalizedType = this.normalizeType(type);

        // 애니메이션 등록
        this.animations[normalizedType] = component;

        // 카테고리에 추가 (지정된 경우)
        if (category && this.categories[category]) {
            if (!this.categories[category].includes(normalizedType)) {
                this.categories[category].push(normalizedType);
            }
        }

        console.log(`✅ Registered animation: ${normalizedType}`);
    }

    /**
     * 📊 팩토리 상태 정보
     * @returns {Object} 팩토리 상태
     */
    static getFactoryInfo() {
        return {
            version: 'development',
            mode: 'placeholder-only',
            totalAnimations: Object.keys(this.animations).length,
            categories: Object.keys(this.categories),
            availableTypes: this.getAvailableTypes(),
            categoriesInfo: Object.entries(this.categories).map(([name, types]) => ({
                name,
                count: types.length,
                types
            })),
            note: '모든 애니메이션이 개발 중입니다. 실제 컴포넌트는 곧 추가될 예정입니다.'
        };
    }
}

// 🎨 편의 함수들
export const createAnimation = (type, props) =>
    AnimationFactory.createAnimation(type, props);

export const isValidAnimationType = (type) =>
    AnimationFactory.isValidType(type);

export const getAnimationTypes = () =>
    AnimationFactory.getAvailableTypes();

export const registerAnimation = (type, component, category) =>
    AnimationFactory.registerAnimation(type, component, category);

// 기본 export
export default AnimationFactory;

// 개발 상태 로그
console.log('🏭 AnimationFactory (개발 중) 로드됨:', AnimationFactory.getFactoryInfo());