// AnimationFactory.js - 강화된 자동 감지 시스템
import React from 'react';

import SortAnimation from './animations/SortAnimation';
import BinaryTreeAnimation from './animations/BinaryTreeAnimation';
import GraphAnimation from './animations/GraphAnimation';
import HeapAnimation from './animations/HeapAnimation';
import LinkedListAnimation from './animations/LinkedListAnimation';
import RecursionAnimation from './animations/RecursionAnimation';
import StackAnimation from './animations/StackAnimation';
import QueueAnimation from './animations/QueueAnimation';
import PlaceholderAnimation from './animations/PlaceholderAnimation';

/**
 * 🏭 AnimationFactory - DV-Flow v1.3 지원 + 강화된 자동 감지
 */
export class AnimationFactory {
    static animations = {
        // ✅ 정렬 알고리즘
        'bubble-sort': SortAnimation,
        'selection-sort': SortAnimation,
        'insertion-sort': SortAnimation,
        'merge-sort': SortAnimation,
        'quick-sort': SortAnimation,
        'sort': SortAnimation,

        // ✅ 트리
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
        'factorial': RecursionAnimation,

        // ✅ 스택
        'stack': StackAnimation,
        'stack-demo': StackAnimation,
        'stack-visualization': StackAnimation,

        // ✅ 큐
        'queue': QueueAnimation,
        'queue-demo': QueueAnimation,
        'fifo-queue': QueueAnimation,

        // 🚧 기타
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
            eventsCount: props.data?.events?.length || 0
        });

        const normalizedType = this.normalizeType(type);
        const AnimationComponent = this.animations[normalizedType] || PlaceholderAnimation;

        return React.createElement(AnimationComponent, {
            key: `animation-${normalizedType}`,
            animationType: normalizedType,
            ...props
        });
    }

    /**
     * 🔧 타입 정규화
     */
    static normalizeType(type) {
        if (!type || typeof type !== 'string') return 'unknown';
        return type.toLowerCase().trim().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '') || 'unknown';
    }

    /**
     * 🎯 강화된 애니메이션 타입 자동 감지
     */
    static detectAnimationType(events) {
        if (!events || events.length === 0) return 'variables';

        // 1️⃣ viz.type 우선 확인 (명시적 지정)
        for (let event of events) {
            if (event.viz?.type) {
                const vizType = event.viz.type.toLowerCase();
                console.log('✅ viz.type 감지:', vizType);

                // 정렬 타입들
                if (['bubble-sort', 'selection-sort', 'insertion-sort', 'merge-sort', 'quick-sort'].includes(vizType)) {
                    return vizType;
                }

                // 자료구조 타입들
                if (vizType === 'heap') return 'heap';
                if (vizType === 'bst' || vizType === 'tree') return 'binary-tree';
                if (vizType === 'graph') return 'graph';
                if (vizType === 'list' || vizType === 'linkedlist') return 'linked-list';
                if (vizType === 'recursion' || vizType === 'recursive') return 'recursion';
                if (vizType === 'stack') return 'stack';
                if (vizType === 'queue' || vizType === 'fifo') return 'queue';
            }
        }

        const stackOp = events.find(e =>
            e.kind === 'ds_op' &&
            e.target &&
            e.target.toLowerCase().includes('stack')
        );
        if (stackOp) {
            console.log('✅ ds_op target으로 stack 감지');
            return 'stack';
        }

        const queueOp = events.find(e => {
            if (e.kind !== 'ds_op' || !e.target) return false;
            const target = e.target.toLowerCase().trim();
            if (target.includes('queue')) return true;
            return target === 'q' || target === 'queue';
        });
        if (queueOp) {
            console.log('✅ ds_op target으로 queue 감지');
            return 'queue';
        }

        // 2️⃣ ds_op의 target으로 자료구조 감지
        const heapOp = events.find(e =>
            e.kind === 'ds_op' &&
            e.target &&
            e.target.toLowerCase().includes('heap')
        );
        if (heapOp) {
            console.log('✅ ds_op target으로 heap 감지');
            return 'heap';
        }

        const listOp = events.find(e =>
            e.kind === 'ds_op' &&
            e.target &&
            (e.target.toLowerCase().includes('list') ||
                e.target.toLowerCase().includes('linkedlist') ||
                e.target.toLowerCase().includes('node'))
        );
        if (listOp) {
            console.log('✅ ds_op target으로 linked-list 감지');
            return 'linked-list';
        }

        const graphOp = events.find(e =>
            e.kind === 'ds_op' &&
            e.target &&
            (e.target.toLowerCase().includes('graph') ||
                e.target.toLowerCase().includes('adj'))
        );
        if (graphOp) {
            console.log('✅ ds_op target으로 graph 감지');
            return 'graph';
        }

        const treeOp = events.find(e =>
            e.kind === 'ds_op' &&
            e.target &&
            (e.target.toLowerCase().includes('tree') ||
                e.target.toLowerCase().includes('bst'))
        );
        if (treeOp) {
            console.log('✅ ds_op target으로 binary-tree 감지');
            return 'binary-tree';
        }

        // 3️⃣ 재귀 패턴 감지 (call/return 분석) - 강화됨!
        const callEvents = events.filter(e => e.kind === 'call');
        const returnEvents = events.filter(e => e.kind === 'return');

        if (callEvents.length >= 3 && returnEvents.length >= 3) {
            // 같은 함수가 여러 번 호출되는지 확인
            const functionCallCounts = {};
            const functionReturnCounts = {};

            callEvents.forEach(e => {
                if (e.fn) {
                    functionCallCounts[e.fn] = (functionCallCounts[e.fn] || 0) + 1;
                }
            });

            returnEvents.forEach(e => {
                if (e.fn) {
                    functionReturnCounts[e.fn] = (functionReturnCounts[e.fn] || 0) + 1;
                }
            });

            // 같은 함수의 call/return이 각각 3번 이상이면 재귀
            for (const fn in functionCallCounts) {
                const callCount = functionCallCounts[fn];
                const returnCount = functionReturnCounts[fn] || 0;

                if (callCount >= 3 && returnCount >= 3) {
                    const ratio = returnCount / callCount;
                    // call과 return 개수가 비슷하면 재귀
                    if (ratio >= 0.8 && ratio <= 1.2) {
                        console.log('✅ 재귀 패턴 감지 (call/return 균형)', {
                            function: fn,
                            calls: callCount,
                            returns: returnCount,
                            ratio: ratio
                        });
                        return 'recursion';
                    }
                }
            }
        }

        // 4️⃣ 정렬 알고리즘 패턴 감지 (강화!)
        const hasCompare = events.some(e => e.kind === 'compare');
        const hasSwap = events.some(e => e.kind === 'swap');

        if (hasCompare && hasSwap) {
            // QuickSort: pivot 존재
            const hasPivot = events.some(e =>
                e.viz?.pivot !== undefined ||
                (e.kind === 'assign' && e.var && e.var.includes('pivot'))
            );
            if (hasPivot) {
                console.log('✅ QuickSort 감지 (pivot 발견)');
                return 'quick-sort';
            }

            // MergeSort: merge 이벤트 존재
            const hasMerge = events.some(e => e.kind === 'merge');
            if (hasMerge) {
                console.log('✅ MergeSort 감지 (merge 이벤트)');
                return 'merge-sort';
            }

            // SelectionSort vs InsertionSort vs BubbleSort 구분
            const sortType = this.detectSortPattern(events);
            console.log('✅ 정렬 패턴 감지:', sortType);
            return sortType;
        }

        // 5️⃣ 기본값
        console.log('⚠️ 감지 실패 - variables로 처리');
        return 'variables';
    }

    /**
     * 🔍 정렬 알고리즘 세부 패턴 분석
     */
    static detectSortPattern(events) {
        const compares = events.filter(e => e.kind === 'compare');
        const swaps = events.filter(e => e.kind === 'swap');

        if (compares.length === 0 || swaps.length === 0) {
            return 'bubble-sort'; // 기본값
        }

        // SelectionSort 특징: 라운드당 swap이 적음 (보통 1번)
        // compare 횟수 대비 swap이 적으면 Selection
        const swapRatio = swaps.length / compares.length;

        if (swapRatio < 0.3) {
            console.log('📊 SelectionSort 특징: swap 비율 낮음', swapRatio);
            return 'selection-sort';
        }

        // InsertionSort 특징: 연속된 swap (삽입 위치까지 밀어내기)
        // swap이 연속으로 일어나는 패턴 확인
        let consecutiveSwaps = 0;
        let maxConsecutiveSwaps = 0;

        for (let i = 1; i < events.length; i++) {
            if (events[i].kind === 'swap' && events[i-1].kind === 'swap') {
                consecutiveSwaps++;
                maxConsecutiveSwaps = Math.max(maxConsecutiveSwaps, consecutiveSwaps);
            } else if (events[i].kind === 'swap') {
                consecutiveSwaps = 1;
            } else {
                consecutiveSwaps = 0;
            }
        }

        if (maxConsecutiveSwaps >= 2) {
            console.log('📊 InsertionSort 특징: 연속 swap 패턴', maxConsecutiveSwaps);
            return 'insertion-sort';
        }

        // BubbleSort 특징: compare 직후 swap (인접 원소 교환)
        let immediateSwaps = 0;
        for (let i = 1; i < events.length; i++) {
            if (events[i].kind === 'swap' && events[i-1].kind === 'compare') {
                immediateSwaps++;
            }
        }

        const immediateSwapRatio = immediateSwaps / swaps.length;
        if (immediateSwapRatio > 0.5) {
            console.log('📊 BubbleSort 특징: compare 직후 swap', immediateSwapRatio);
            return 'bubble-sort';
        }

        // 기본값
        console.log('📊 정렬 패턴 불명확 - BubbleSort 기본 처리');
        return 'bubble-sort';
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
            version: '2.3.0-recursion-enhanced',
            mode: 'smart-pattern-detection',
            jsonSchema: 'DV-Flow v1.3',
            totalAnimations: available.length,
            implementedCount: implemented.length,
            pendingCount: available.length - implemented.length,
            implementedTypes: implemented,
            availableTypes: available
        };
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

export default AnimationFactory;

console.log('🏭 AnimationFactory (Enhanced) 로드 완료:', AnimationFactory.getFactoryInfo());