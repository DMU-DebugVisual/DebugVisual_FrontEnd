// AnimationFactory.js - 모듈화된 버전
import React from 'react';

// 실제 애니메이션 컴포넌트들 import
import BubbleSortAnimation from './animations/BubbleSortAnimation';
import LinkedListAnimation from "./animations/LinkedListAnimation";
import {Link} from "react-router-dom";
import BinaryTreeAnimation from "./animations/BinaryTreeAnimation";
import HeapAnimation from "./animations/HeapAnimation";
import GraphAnimation from "./animations/GraphAnimation";
import FibonacciRecursionAnimation from "./animations/FibonacciRecursionAnimation";
// import FibonacciAnimation from './animations/FibonacciAnimation'; // 나중에 필요할 때 추가

/**
 * 🎨 플레이스홀더 애니메이션 컴포넌트
 * 아직 구현되지 않은 애니메이션들을 위한 기본 컴포넌트
 */
const PlaceholderAnimation = ({
                                  animationType = 'unknown',
                                  data = null,
                                  currentStep = 0,
                                  totalSteps = 0,
                                  isPlaying = false
                              }) => {
    // 애니메이션 타입별 정보 매핑
    const getAnimationInfo = (type) => {
        const typeMap = {
            'fibonacci-recursion': {
                icon: '🌳',
                name: '피보나치 재귀',
                description: '재귀 함수를 이용한 피보나치 수열 계산을 시각화합니다',
                features: ['재귀 호출 트리', '메모이제이션', '시간 복잡도 분석']
            },
            'linked-list': {
                icon: '🔗',
                name: '링크드 리스트',
                description: '노드 간 연결 구조를 시각화합니다',
                features: ['노드 삽입/삭제', '포인터 추적', '메모리 할당']
            },
            'binary-tree': {
                icon: '🌲',
                name: '이진 트리',
                description: '이진 트리 순회와 조작을 보여줍니다',
                features: ['전위/중위/후위 순회', '노드 삽입/삭제', '균형 조절']
            },
            'heap': {
                icon: '⛰️',
                name: '힙 자료구조',
                description: '힙 정렬과 우선순위 큐를 시각화합니다',
                features: ['힙 구성', '최대/최소값 추출', '힙 정렬']
            },
            'variables': {
                icon: '📝',
                name: '변수 추적',
                description: '프로그램 실행 중 변수 상태 변화를 추적합니다',
                features: ['변수 상태 추적', '메모리 사용량', '스코프 관리']
            },
            'array': {
                icon: '📋',
                name: '배열 조작',
                description: '배열 원소들의 변화를 시각화합니다',
                features: ['원소 접근', '삽입/삭제', '정렬 과정']
            }
        };
        return typeMap[type] || {
            icon: '🎬',
            name: '알고리즘 시각화',
            description: '새로운 알고리즘 애니메이션입니다',
            features: ['단계별 실행', '상태 추적', '시각적 표현']
        };
    };

    const { icon, name, description, features } = getAnimationInfo(animationType);

    return (
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
            borderRadius: '16px',
            textAlign: 'center',
            minHeight: '400px',
            fontFamily: 'Arial, sans-serif'
        }}>
            {/* 메인 아이콘 */}
            <div style={{
                fontSize: '72px',
                marginBottom: '24px',
                animation: 'float 3s ease-in-out infinite',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
            }}>
                {icon}
            </div>

            {/* 개발 상태 배지 */}
            <div style={{
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                color: 'white',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 'bold',
                marginBottom: '16px',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
            }}>
                🚧 개발 예정
            </div>

            {/* 제목과 설명 */}
            <h3 style={{
                margin: '0 0 12px 0',
                color: '#1e293b',
                fontSize: '24px',
                fontWeight: '700'
            }}>
                {name} 애니메이션
            </h3>

            <p style={{
                margin: '0 0 32px 0',
                color: '#64748b',
                fontSize: '16px',
                lineHeight: '1.6',
                maxWidth: '400px'
            }}>
                {description}
            </p>

            {/* 예정 기능들 */}
            <div style={{
                background: '#f8fafc',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                width: '100%',
                maxWidth: '450px',
                textAlign: 'left'
            }}>
                <h4 style={{
                    margin: '0 0 16px 0',
                    color: '#374151',
                    fontSize: '16px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    ✨ 예정된 기능들
                </h4>
                <ul style={{
                    margin: 0,
                    padding: '0 0 0 20px',
                    listStyleType: 'none'
                }}>
                    {features.map((feature, index) => (
                        <li key={index} style={{
                            fontSize: '14px',
                            color: '#64748b',
                            marginBottom: '8px',
                            position: 'relative',
                            paddingLeft: '20px'
                        }}>
              <span style={{
                  position: 'absolute',
                  left: '0',
                  color: '#8b5cf6'
              }}>
                ▶
              </span>
                            {feature}
                        </li>
                    ))}
                </ul>
            </div>

            {/* 현재 상태 정보 */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '12px',
                width: '100%',
                maxWidth: '400px',
                marginTop: '32px'
            }}>
                <div style={{
                    padding: '12px',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '8px',
                    border: '1px solid #bae6fd'
                }}>
                    <div style={{ fontSize: '11px', color: '#0369a1', marginBottom: '4px' }}>현재 단계</div>
                    <div style={{ fontSize: '16px', color: '#0c4a6e', fontWeight: 'bold' }}>
                        {currentStep + 1} / {totalSteps}
                    </div>
                </div>

                <div style={{
                    padding: '12px',
                    backgroundColor: '#fef3c7',
                    borderRadius: '8px',
                    border: '1px solid #fcd34d'
                }}>
                    <div style={{ fontSize: '11px', color: '#92400e', marginBottom: '4px' }}>상태</div>
                    <div style={{ fontSize: '14px', color: '#92400e', fontWeight: 'bold' }}>
                        {isPlaying ? '재생중' : '대기중'}
                    </div>
                </div>

                <div style={{
                    padding: '12px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db'
                }}>
                    <div style={{ fontSize: '11px', color: '#374151', marginBottom: '4px' }}>타입</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold' }}>
                        {animationType}
                    </div>
                </div>
            </div>

            {/* 개발 진행도 */}
            <div style={{
                width: '100%',
                maxWidth: '400px',
                marginTop: '32px',
                padding: '16px',
                background: 'linear-gradient(135deg, #fef7ff, #faf5ff)',
                borderRadius: '12px',
                border: '1px solid #e9d5ff'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                }}>
          <span style={{ fontSize: '12px', color: '#7c3aed', fontWeight: '600' }}>
            개발 진행도
          </span>
                    <span style={{ fontSize: '12px', color: '#7c3aed' }}>25%</span>
                </div>
                <div style={{
                    width: '100%',
                    height: '6px',
                    background: '#e9d5ff',
                    borderRadius: '3px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: '25%',
                        height: '100%',
                        background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)',
                        borderRadius: '3px',
                        transition: 'width 0.3s ease'
                    }}></div>
                </div>
                <div style={{
                    fontSize: '11px',
                    color: '#6b46c1',
                    marginTop: '8px',
                    textAlign: 'center'
                }}>
                    설계 완료 → 구현 예정
                </div>
            </div>

            {/* CSS 애니메이션 */}
            <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-8px) scale(1.02); }
        }
      `}</style>
        </div>
    );
};

/**
 * 🏭 AnimationFactory 클래스
 * 팩토리 패턴을 사용하여 애니메이션 컴포넌트를 동적으로 생성
 */
export class AnimationFactory {
    // 📋 등록된 애니메이션 컴포넌트들
    static animations = {
        // ✅ 구현 완료
        'bubble-sort': BubbleSortAnimation,
        'linked-list': LinkedListAnimation,
        'binary-tree': BinaryTreeAnimation,
        'heap': HeapAnimation,
        'graph': GraphAnimation,
        'fibonacci-recursion': FibonacciRecursionAnimation,

        // 🚧 개발 예정 (플레이스홀더)
        'selection-sort': PlaceholderAnimation,
        'insertion-sort': PlaceholderAnimation,
        'merge-sort': PlaceholderAnimation,
        'quick-sort': PlaceholderAnimation,

        // 📝 기본값들
        'variables': PlaceholderAnimation,
        'array': PlaceholderAnimation,
        'default': PlaceholderAnimation,
        'unknown': PlaceholderAnimation
    };

    /**
     * 🎨 애니메이션 컴포넌트 생성
     * @param {string} type - 애니메이션 타입
     * @param {object} props - 컴포넌트에 전달할 props
     * @returns {React.Element} 생성된 애니메이션 컴포넌트
     */
    static createAnimation(type, props = {}) {
        console.log(`🏭 AnimationFactory.createAnimation 호출:`, {
            type,
            hasProps: !!props,
            propsKeys: Object.keys(props)
        });

        const normalizedType = this.normalizeType(type);
        const AnimationComponent = this.animations[normalizedType] || PlaceholderAnimation;

        console.log(`✅ 컴포넌트 선택됨:`, {
            originalType: type,
            normalizedType,
            componentName: AnimationComponent.name,
            isImplemented: this.isImplemented(type)
        });

        // React 엘리먼트 생성
        const animationElement = React.createElement(AnimationComponent, {
            key: `animation-${normalizedType}-${Date.now()}`,
            animationType: normalizedType,
            ...props
        });

        console.log(`🎬 애니메이션 엘리먼트 생성 완료:`, animationElement);
        return animationElement;
    }

    /**
     * 🔧 애니메이션 타입 정규화
     * @param {string} type - 원본 타입
     * @returns {string} 정규화된 타입
     */
    static normalizeType(type) {
        if (!type || typeof type !== 'string') {
            console.warn('⚠️ 잘못된 애니메이션 타입:', type);
            return 'unknown';
        }

        const normalized = type.toLowerCase()
            .trim()
            .replace(/[\s_]+/g, '-')
            .replace(/[^a-z0-9-]/g, '');

        console.log(`🔧 타입 정규화: "${type}" → "${normalized}"`);
        return normalized || 'unknown';
    }

    /**
     * ✅ 실제 구현된 애니메이션인지 확인
     * @param {string} type - 애니메이션 타입
     * @returns {boolean} 구현 여부
     */
    static isImplemented(type) {
        const normalizedType = this.normalizeType(type);
        const component = this.animations[normalizedType];

        // 실제 구현된 컴포넌트인지 확인 (PlaceholderAnimation이 아닌지)
        const isImplemented = component && component !== PlaceholderAnimation;

        console.log(`✅ 구현 상태 확인: ${normalizedType} → ${isImplemented}`);
        return isImplemented;
    }

    /**
     * 📋 사용 가능한 애니메이션 타입 목록
     * @returns {Array<string>} 애니메이션 타입 배열
     */
    static getAvailableTypes() {
        return Object.keys(this.animations).filter(type =>
            !['default', 'unknown', 'variables', 'array'].includes(type)
        );
    }

    /**
     * 🎯 구현된 애니메이션 타입들만 반환
     * @returns {Array<string>} 구현된 애니메이션 타입 배열
     */
    static getImplementedTypes() {
        return Object.entries(this.animations)
            .filter(([type, component]) =>
                component !== PlaceholderAnimation &&
                !['default', 'unknown', 'variables', 'array'].includes(type)
            )
            .map(([type]) => type);
    }

    /**
     * 🚧 개발 예정인 애니메이션 타입들 반환
     * @returns {Array<string>} 개발 예정 애니메이션 타입 배열
     */
    static getPendingTypes() {
        return Object.entries(this.animations)
            .filter(([type, component]) =>
                component === PlaceholderAnimation &&
                !['default', 'unknown', 'variables', 'array'].includes(type)
            )
            .map(([type]) => type);
    }

    /**
     * 📊 팩토리 상태 정보
     * @returns {object} 팩토리 상태 객체
     */
    static getFactoryInfo() {
        const implementedTypes = this.getImplementedTypes();
        const pendingTypes = this.getPendingTypes();
        const totalTypes = this.getAvailableTypes();

        return {
            version: '2.0.0',
            mode: 'modular',
            totalAnimations: totalTypes.length,
            implementedCount: implementedTypes.length,
            pendingCount: pendingTypes.length,
            implementedTypes,
            pendingTypes,
            availableTypes: totalTypes,
            implementationRate: Math.round((implementedTypes.length / totalTypes.length) * 100)
        };
    }

    /**
     * 🎮 애니메이션 등록 (동적 추가)
     * @param {string} type - 애니메이션 타입
     * @param {React.Component} component - 애니메이션 컴포넌트
     */
    static registerAnimation(type, component) {
        const normalizedType = this.normalizeType(type);

        if (!component || typeof component !== 'function') {
            console.error('❌ 잘못된 컴포넌트:', component);
            return false;
        }

        this.animations[normalizedType] = component;
        console.log(`✅ 애니메이션 등록 완료: ${normalizedType}`);
        return true;
    }
}

// 편의 함수들 export
export const createAnimation = (type, props) =>
    AnimationFactory.createAnimation(type, props);

export const isImplementedAnimation = (type) =>
    AnimationFactory.isImplemented(type);

export const getAnimationTypes = () =>
    AnimationFactory.getAvailableTypes();

export const getImplementedAnimations = () =>
    AnimationFactory.getImplementedTypes();

export const getPendingAnimations = () =>
    AnimationFactory.getPendingTypes();

export const getFactoryInfo = () =>
    AnimationFactory.getFactoryInfo();

export const registerAnimation = (type, component) =>
    AnimationFactory.registerAnimation(type, component);

// 기본 export
export default AnimationFactory;

// 🚀 초기화 로그
console.log('🏭 AnimationFactory (모듈화) 로드 완료:', AnimationFactory.getFactoryInfo());