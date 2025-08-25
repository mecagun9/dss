import { useState, useEffect, useRef } from 'react';

/**
 * 디버깅을 위한 커스텀 훅
 * @param {string} componentName - 컴포넌트 이름
 * @param {object} options - 디버깅 옵션
 * @returns {object} 디버깅 도구들
 */
export const useDebugger = (componentName, options = {}) => {
  const {
    logMounts = true,
    logRenders = true,
    logProps = false,
    logState = false,
    performance = false
  } = options;

  const [debugInfo, setDebugInfo] = useState({
    mountCount: 0,
    renderCount: 0,
    lastRenderTime: null,
    lastProps: null,
    lastState: null,
    errors: []
  });

  const mountTimeRef = useRef(null);
  const renderTimeRef = useRef(null);
  const prevPropsRef = useRef(null);
  const prevStateRef = useRef(null);

  // 컴포넌트 마운트 시
  useEffect(() => {
    if (logMounts) {
      mountTimeRef.current = performance.now();
      console.group(`🔍 [${componentName}] 컴포넌트 마운트`);
      console.log('⏰ 마운트 시간:', new Date().toISOString());
      console.log('📱 화면 크기:', window.innerWidth, 'x', window.innerHeight);
      console.log('🌐 User Agent:', navigator.userAgent);
      console.groupEnd();
    }

    setDebugInfo(prev => ({
      ...prev,
      mountCount: prev.mountCount + 1
    }));

    return () => {
      if (logMounts) {
        const unmountTime = performance.now();
        const mountDuration = unmountTime - (mountTimeRef.current || 0);
        console.group(`🔍 [${componentName}] 컴포넌트 언마운트`);
        console.log('⏰ 언마운트 시간:', new Date().toISOString());
        console.log('⏱️ 마운트 지속 시간:', mountDuration.toFixed(2), 'ms');
        console.groupEnd();
      }
    };
  }, [componentName, logMounts]);

  // 렌더링 시
  useEffect(() => {
    if (logRenders) {
      const now = performance.now();
      const renderDuration = renderTimeRef.current ? now - renderTimeRef.current : 0;
      renderTimeRef.current = now;

      console.group(`🔄 [${componentName}] 렌더링 #${debugInfo.renderCount + 1}`);
      console.log('⏰ 렌더링 시간:', new Date().toLocaleTimeString());
      if (renderDuration > 0) {
        console.log('⏱️ 렌더링 간격:', renderDuration.toFixed(2), 'ms');
      }
      console.groupEnd();
    }

    setDebugInfo(prev => ({
      ...prev,
      renderCount: prev.renderCount + 1,
      lastRenderTime: new Date().toISOString()
    }));
  });

  // props 변경 감지
  const logPropsChange = (currentProps) => {
    if (logProps && prevPropsRef.current) {
      const changedProps = {};
      Object.keys(currentProps).forEach(key => {
        if (prevPropsRef.current[key] !== currentProps[key]) {
          changedProps[key] = {
            from: prevPropsRef.current[key],
            to: currentProps[key]
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.group(`📝 [${componentName}] Props 변경 감지`);
        console.table(changedProps);
        console.groupEnd();
      }
    }
    prevPropsRef.current = currentProps;
  };

  // state 변경 감지
  const logStateChange = (currentState) => {
    if (logState && prevStateRef.current) {
      const changedState = {};
      Object.keys(currentState).forEach(key => {
        if (prevStateRef.current[key] !== currentState[key]) {
          changedState[key] = {
            from: prevStateRef.current[key],
            to: currentState[key]
          };
        }
      });

      if (Object.keys(changedState).length > 0) {
        console.group(`📊 [${componentName}] State 변경 감지`);
        console.table(changedState);
        console.groupEnd();
      }
    }
    prevStateRef.current = currentState;
  };

  // 에러 로깅
  const logError = (error, context = '') => {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      componentName
    };

    console.group(`❌ [${componentName}] 에러 발생`);
    console.error('에러 메시지:', error.message);
    console.error('에러 스택:', error.stack);
    if (context) console.error('컨텍스트:', context);
    console.error('발생 시간:', errorInfo.timestamp);
    console.groupEnd();

    setDebugInfo(prev => ({
      ...prev,
      errors: [...prev.errors, errorInfo]
    }));
  };

  // 성능 측정
  const measurePerformance = (name, fn) => {
    if (!performance) return fn();

    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    console.log(`⏱️ [${componentName}] ${name} 실행 시간:`, (end - start).toFixed(2), 'ms');
    return result;
  };

  // 디버그 정보 출력
  const showDebugInfo = () => {
    console.group(`🔍 [${componentName}] 디버그 정보`);
    console.log('마운트 횟수:', debugInfo.mountCount);
    console.log('렌더링 횟수:', debugInfo.renderCount);
    console.log('마지막 렌더링:', debugInfo.lastRenderTime);
    console.log('에러 개수:', debugInfo.errors.length);
    console.log('전체 디버그 정보:', debugInfo);
    console.groupEnd();
  };

  // 에러 목록 출력
  const showErrors = () => {
    if (debugInfo.errors.length === 0) {
      console.log(`✅ [${componentName}] 에러가 없습니다.`);
      return;
    }

    console.group(`❌ [${componentName}] 에러 목록 (${debugInfo.errors.length}개)`);
    debugInfo.errors.forEach((error, index) => {
      console.group(`에러 #${index + 1}`);
      console.error('메시지:', error.message);
      console.error('컨텍스트:', error.context);
      console.error('시간:', error.timestamp);
      console.groupEnd();
    });
    console.groupEnd();
  };

  return {
    debugInfo,
    logPropsChange,
    logStateChange,
    logError,
    measurePerformance,
    showDebugInfo,
    showErrors
  };
};
