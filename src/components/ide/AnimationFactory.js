// AnimationFactory.js - DV-Flow v1.3 완전 대응 (key 수정)
import React from 'react';

// 실제 애니메이션 컴포넌트들 import
import SortAnimation from './animations/SortAnimation';
import BinaryTreeAnimation from './animations/BinaryTreeAnimation';
import GraphAnimation from './animations/GraphAnimation';
import HeapAnimation from './animations/HeapAnimation';
import LinkedListAnimation from './animations/LinkedListAnimation';
import RecursionAnimation from './animations/RecursionAnimation';
import PlaceholderAnimation from './animations/PlaceholderAnimation';

/**
 * 🏭 AnimationFactory - DV-Flow v1.3 지원
 */
export class AnimationFactory {
    static animations = {
        // ✅ 정렬 알고리즘 (SortAnimation 사용)
        'bubble-sort': SortAnimation,
        'selection-sort': SortAnimation,
        'insertion-sort': SortAnimation,
        'merge-sort': SortAnimation,
        'quick-sort': SortAnimation,
        'sort': SortAnimation,

        // ✅ 트리 구조
        'binary-tree': BinaryTreeAnimation,
        'tree': BinaryTreeAnimation,

        // ✅ 힙
        'heap': HeapAnimation,
        'min-heap': HeapAnimation,
        'max-heap': HeapAnimation,

        // ✅ 그래프
        'graph': GraphAnimation,
        'bfs': GraphAnimation,
        'dfs': GraphAnimation,

        // ✅ 링크드 리스트
        'linked-list': LinkedListAnimation,
        'list': LinkedListAnimation,

        // ✅ 재귀
        'recursion': RecursionAnimation,
        'fibonacci-recursion': RecursionAnimation,
        'fibonacci': RecursionAnimation,

        // 🚧 기타 (Placeholder)
        'variables': PlaceholderAnimation,
        'default': PlaceholderAnimation
    };

    /**
     * 🎨 애니메이션 생성
     */
    static createAnimation(type, props = {}) {
        console.log('🏭 AnimationFactory.createAnimation:', {
            type,
            hasData: !!props.data,
            eventsCount: props.data?.events?.length || 0,
            currentStep: props.currentStep,
            totalSteps: props.totalSteps
        });

        const normalizedType = this.normalizeType(type);
        const AnimationComponent = this.animations[normalizedType] || PlaceholderAnimation;

        // DV-Flow v1.3 검증
        if (props.data && !props.data.events) {
            console.warn('⚠️ 구버전 JSON 구조 감지! events 필드가 없습니다.');
        }

        // ⚡ CRITICAL: Date.now() 제거! 고정된 key 사용
        return React.createElement(AnimationComponent, {
            key: `animation-${normalizedType}`, // 타입별 고정 key
            animationType: normalizedType,
            ...props
        });
    }

    /**
     * 🔧 타입 정규화
     */
    static normalizeType(type) {
        if (!type || typeof type !== 'string') {
            return 'unknown';
        }
        return type.toLowerCase().trim().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '') || 'unknown';
    }

    /**
     * ✅ 구현 여부 확인
     */
    static isImplemented(type) {
        const normalizedType = this.normalizeType(type);
        const component = this.animations[normalizedType];
        return component && component !== PlaceholderAnimation;
    }

    /**
     * 📋 사용 가능한 타입들
     */
    static getAvailableTypes() {
        return Object.keys(this.animations).filter(type =>
            !['default', 'unknown', 'variables'].includes(type)
        );
    }

    /**
     * 🎯 구현된 타입들만
     */
    static getImplementedTypes() {
        return Object.entries(this.animations)
            .filter(([type, component]) =>
                component !== PlaceholderAnimation &&
                !['default', 'unknown', 'variables'].includes(type)
            )
            .map(([type]) => type);
    }

    /**
     * 📊 팩토리 정보
     */
    static getFactoryInfo() {
        const implemented = this.getImplementedTypes();
        const available = this.getAvailableTypes();

        return {
            version: '2.1.0-v1.3',
            mode: 'events-based',
            jsonSchema: 'DV-Flow v1.3',
            totalAnimations: available.length,
            implementedCount: implemented.length,
            pendingCount: available.length - implemented.length,
            implementedTypes: implemented,
            availableTypes: available
        };
    }

    /**
     * 🔍 애니메이션 타입 자동 감지
     */
    static detectAnimationType(events) {
        if (!events || events.length === 0) return 'variables';

        // 정렬 패턴
        const hasCompare = events.some(e => e.kind === 'compare');
        const hasSwap = events.some(e => e.kind === 'swap');
        if (hasCompare && hasSwap) {
            const hasPivot = events.some(e => e.viz?.pivot !== undefined);
            if (hasPivot) return 'quick-sort';

            const hasMerge = events.some(e => e.kind === 'merge');
            if (hasMerge) return 'merge-sort';

            return 'bubble-sort';
        }

        // 그래프 패턴
        const hasGraphOp = events.some(e =>
            e.kind === 'ds_op' &&
            e.target &&
            (e.target.includes('adj_mat') || e.target.includes('graph'))
        );
        if (hasGraphOp) return 'graph';

        // 트리 패턴
        const hasTreeOp = events.some(e =>
            e.kind === 'ds_op' &&
            e.target &&
            (e.target.includes('tree') || e.target.includes('node'))
        );
        if (hasTreeOp) return 'binary-tree';

        // 힙 패턴
        const hasHeapOp = events.some(e =>
            e.kind === 'ds_op' &&
            e.target &&
            e.target.includes('heap')
        );
        if (hasHeapOp) return 'heap';

        // 링크드 리스트 패턴
        const hasListOp = events.some(e =>
            e.kind === 'ds_op' &&
            e.target &&
            e.target.includes('list')
        );
        if (hasListOp) return 'linked-list';

        // 재귀 패턴
        const hasRecursiveCall = events.filter(e => e.kind === 'call').length > 3;
        if (hasRecursiveCall) return 'recursion';

        return 'variables';
    }
}

// 편의 함수들
export const createAnimation = (type, props) =>
    AnimationFactory.createAnimation(type, props);

export const isImplementedAnimation = (type) =>
    AnimationFactory.isImplemented(type);

export const getFactoryInfo = () =>
    AnimationFactory.getFactoryInfo();

export const detectAnimationType = (events) =>
    AnimationFactory.detectAnimationType(events);

// 기본 export
export default AnimationFactory;

console.log('🏭 AnimationFactory (DV-Flow v1.3) 로드 완료:', AnimationFactory.getFactoryInfo());