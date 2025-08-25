# DSS React 프로젝트

이 프로젝트는 React를 사용하여 구축된 웹 애플리케이션입니다.

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm start
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속하여 애플리케이션을 확인할 수 있습니다.

### 3. 프로덕션 빌드
```bash
npm run build
```

## 🐛 디버깅 기능

이 프로젝트는 강력한 디버깅 도구들을 포함하고 있습니다.

### 기본 디버깅 기능

- **컴포넌트 생명주기 추적**: 마운트/언마운트/렌더링 이벤트 로깅
- **에러 처리**: 전역 에러 핸들링 및 에러 정보 수집
- **성능 측정**: 함수 실행 시간 측정 및 분석
- **상태 변경 추적**: props와 state 변경사항 모니터링

### 고급 디버깅 도구

#### 1. 커스텀 훅 (`useDebugger`)
```javascript
const { debugInfo, logError, measurePerformance } = useDebugger('ComponentName', {
  logMounts: true,    // 마운트/언마운트 로깅
  logRenders: true,   // 렌더링 로깅
  logProps: false,    // props 변경 로깅
  logState: true,     // state 변경 로깅
  performance: true    // 성능 측정
});
```

#### 2. 전역 디버깅 유틸리티 (`window.DebugUtils`)
```javascript
// 컴포넌트 트리 정보
window.DebugUtils.showComponentTree();

// 메모리 사용량 확인
window.DebugUtils.checkMemoryUsage();

// 네트워크 요청 모니터링
const networkMonitor = window.DebugUtils.monitorNetwork();

// 에러 통계 확인
window.DebugUtils.errorStats.showStats();

// 성능 측정
window.DebugUtils.measurePerformance('함수명', () => {
  // 측정할 함수
}, 10); // 10번 반복 측정
```

### 디버깅 사용법

1. **브라우저 개발자 도구 열기**: F12 키 또는 우클릭 → "검사"
2. **Console 탭 확인**: 모든 디버깅 로그가 여기에 표시됩니다
3. **디버깅 버튼 클릭**: 앱 화면의 다양한 디버깅 기능을 테스트할 수 있습니다
4. **전역 도구 사용**: 콘솔에서 `window.DebugUtils` 명령어로 직접 사용 가능

### 디버깅 기능 목록

- ✅ **기본 디버그 정보**: 컴포넌트 상태 및 렌더링 정보
- ✅ **고급 디버그 정보**: 커스텀 훅을 통한 상세 정보
- ✅ **에러 목록 보기**: 발생한 모든 에러의 히스토리
- ✅ **콘솔 로그 테스트**: 다양한 로그 레벨 테스트
- ✅ **에러 테스트**: 의도적인 에러 발생 및 처리 테스트
- ✅ **비동기 에러 테스트**: Promise 에러 처리 테스트
- ✅ **성능 테스트**: 함수 실행 시간 측정
- ✅ **전역 디버깅 도구**: 브라우저 전역 디버깅 유틸리티
- ✅ **네트워크 모니터링**: HTTP 요청 추적 및 분석

## 사용 가능한 스크립트

- `npm start`: 개발 서버를 실행합니다
- `npm run build`: 프로덕션용 빌드를 생성합니다
- `npm test`: 테스트를 실행합니다
- `npm run eject`: Create React App 설정을 추출합니다 (주의: 되돌릴 수 없음)

## 프로젝트 구조

```
dss/
├── public/
│   └── index.html          # HTML 템플릿
├── src/
│   ├── hooks/
│   │   └── useDebugger.js  # 커스텀 디버깅 훅
│   ├── utils/
│   │   └── debugUtils.js   # 전역 디버깅 유틸리티
│   ├── App.js             # 메인 App 컴포넌트
│   ├── App.css            # App 컴포넌트 스타일
│   ├── index.js           # 애플리케이션 진입점
│   └── index.css          # 전역 스타일
├── package.json            # 프로젝트 의존성 및 스크립트
└── README.md              # 프로젝트 설명서
```

## 기술 스택

- React 18.2.0
- React DOM 18.2.0
- Create React App 5.0.1

## 🚀 개발 팁

### 디버깅 모드 활성화
개발 모드에서는 자동으로 디버깅이 활성화됩니다. 프로덕션 빌드에서는 디버깅 기능이 비활성화됩니다.

### 성능 최적화
- `useDebugger` 훅의 옵션을 조정하여 필요한 정보만 로깅
- 프로덕션 환경에서는 `performance: false` 설정 권장
- 불필요한 로깅은 `logRenders: false`로 비활성화

### 에러 처리
- 모든 에러는 자동으로 수집되고 콘솔에 표시됩니다
- `window.DebugUtils.errorStats.showStats()`로 에러 통계 확인 가능
- 에러 컨텍스트 정보를 포함하여 더 정확한 디버깅 가능
