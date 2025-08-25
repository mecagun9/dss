/**
 * 브라우저 개발자 도구를 위한 디버깅 유틸리티
 */

// 전역 디버깅 객체 생성
if (typeof window !== 'undefined') {
  window.DebugUtils = {
    // 컴포넌트 트리 시각화
    showComponentTree: () => {
      console.group('🌳 React 컴포넌트 트리');
      console.log('React DevTools를 사용하여 컴포넌트 트리를 확인하세요.');
      console.log('Chrome: React Developer Tools 확장 프로그램 설치');
      console.log('Firefox: React Developer Tools 확장 프로그램 설치');
      console.groupEnd();
    },

    // 상태 변경 추적
    trackStateChanges: (componentName, initialState) => {
      let currentState = { ...initialState };
      const stateHistory = [initialState];

      return {
        updateState: (newState) => {
          const oldState = { ...currentState };
          currentState = { ...newState };
          
          const changes = {};
          Object.keys(newState).forEach(key => {
            if (oldState[key] !== newState[key]) {
              changes[key] = {
                from: oldState[key],
                to: newState[key],
                timestamp: new Date().toISOString()
              };
            }
          });

          if (Object.keys(changes).length > 0) {
            console.group(`📊 [${componentName}] 상태 변경`);
            console.table(changes);
            console.groupEnd();
          }

          stateHistory.push({ ...newState });
        },

        getStateHistory: () => stateHistory,
        
        showStateHistory: () => {
          console.group(`📚 [${componentName}] 상태 변경 히스토리`);
          stateHistory.forEach((state, index) => {
            console.group(`상태 #${index + 1}`);
            console.log('시간:', new Date().toISOString());
            console.log('상태:', state);
            console.groupEnd();
          });
          console.groupEnd();
        }
      };
    },

    // 성능 측정
    measurePerformance: (name, fn, iterations = 1) => {
      const times = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);

      console.group(`⏱️ 성능 측정: ${name}`);
      console.log('평균 실행 시간:', avgTime.toFixed(2), 'ms');
      console.log('최소 실행 시간:', minTime.toFixed(2), 'ms');
      console.log('최대 실행 시간:', maxTime.toFixed(2), 'ms');
      console.log('반복 횟수:', iterations);
      console.table(times.map((time, index) => ({
        '시도 #': index + 1,
        '실행 시간 (ms)': time.toFixed(2)
      })));
      console.groupEnd();

      return { avgTime, minTime, maxTime, times };
    },

    // 메모리 사용량 확인
    checkMemoryUsage: () => {
      if ('memory' in performance) {
        console.group('💾 메모리 사용량');
        console.log('사용된 JS 힙 크기:', (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2), 'MB');
        console.log('총 JS 힙 크기:', (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2), 'MB');
        console.log('JS 힙 크기 제한:', (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2), 'MB');
        console.groupEnd();
      } else {
        console.log('⚠️ 이 브라우저는 메모리 사용량 정보를 지원하지 않습니다.');
      }
    },

    // 네트워크 요청 모니터링
    monitorNetwork: () => {
      const originalFetch = window.fetch;
      const requests = [];

      window.fetch = function(...args) {
        const startTime = performance.now();
        const requestInfo = {
          url: args[0],
          options: args[1],
          startTime: new Date().toISOString(),
          status: null,
          duration: null
        };

        requests.push(requestInfo);

        return originalFetch.apply(this, args)
          .then(response => {
            requestInfo.status = response.status;
            requestInfo.duration = performance.now() - startTime;
            console.log(`🌐 네트워크 요청 완료: ${args[0]} (${requestInfo.duration.toFixed(2)}ms)`);
            return response;
          })
          .catch(error => {
            requestInfo.status = 'ERROR';
            requestInfo.duration = performance.now() - startTime;
            console.error(`🌐 네트워크 요청 실패: ${args[0]}`, error);
            throw error;
          });
      };

      return {
        getRequests: () => requests,
        showRequests: () => {
          console.group('🌐 네트워크 요청 목록');
          if (requests.length === 0) {
            console.log('아직 네트워크 요청이 없습니다.');
          } else {
            console.table(requests.map((req, index) => ({
              '요청 #': index + 1,
              'URL': req.url,
              '상태': req.status,
              '지속 시간 (ms)': req.duration ? req.duration.toFixed(2) : 'N/A',
              '시작 시간': req.startTime
            })));
          }
          console.groupEnd();
        },
        clearRequests: () => {
          requests.length = 0;
          console.log('✅ 네트워크 요청 목록이 초기화되었습니다.');
        }
      };
    },

    // 에러 통계
    errorStats: {
      errors: [],
      warnings: [],
      
      addError: (error, context = '') => {
        const errorInfo = {
          message: error.message,
          stack: error.stack,
          context,
          timestamp: new Date().toISOString(),
          type: 'error'
        };
        
        window.DebugUtils.errorStats.errors.push(errorInfo);
        console.error('❌ 에러 기록됨:', errorInfo);
      },

      addWarning: (message, context = '') => {
        const warningInfo = {
          message,
          context,
          timestamp: new Date().toISOString(),
          type: 'warning'
        };
        
        window.DebugUtils.errorStats.warnings.push(warningInfo);
        console.warn('⚠️ 경고 기록됨:', warningInfo);
      },

      showStats: () => {
        console.group('📊 에러 및 경고 통계');
        console.log('에러 개수:', window.DebugUtils.errorStats.errors.length);
        console.log('경고 개수:', window.DebugUtils.errorStats.warnings.length);
        
        if (window.DebugUtils.errorStats.errors.length > 0) {
          console.group('❌ 에러 목록');
          window.DebugUtils.errorStats.errors.forEach((error, index) => {
            console.group(`에러 #${index + 1}`);
            console.error('메시지:', error.message);
            console.error('컨텍스트:', error.context);
            console.error('시간:', error.timestamp);
            if (error.stack) console.error('스택:', error.stack);
            console.groupEnd();
          });
          console.groupEnd();
        }

        if (window.DebugUtils.errorStats.warnings.length > 0) {
          console.group('⚠️ 경고 목록');
          window.DebugUtils.errorStats.warnings.forEach((warning, index) => {
            console.group(`경고 #${index + 1}`);
            console.warn('메시지:', warning.message);
            console.warn('컨텍스트:', warning.context);
            console.warn('시간:', warning.timestamp);
            console.groupEnd();
          });
          console.groupEnd();
        }
        console.groupEnd();
      },

      clear: () => {
        window.DebugUtils.errorStats.errors.length = 0;
        window.DebugUtils.errorStats.warnings.length = 0;
        console.log('✅ 에러 및 경고 통계가 초기화되었습니다.');
      }
    }
  };

  // 전역 에러 핸들러 등록
  window.addEventListener('error', (event) => {
    window.DebugUtils.errorStats.addError(event.error, '전역 에러');
  });

  window.addEventListener('unhandledrejection', (event) => {
    window.DebugUtils.errorStats.addError(new Error(event.reason), '처리되지 않은 Promise');
  });

  console.log('🔧 DebugUtils가 전역 객체에 등록되었습니다.');
  console.log('사용법: window.DebugUtils.showComponentTree()');
}

export default window?.DebugUtils || {};
