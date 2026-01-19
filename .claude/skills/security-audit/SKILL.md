---
name: security-audit
description: 프로젝트 종합 보안 감사를 수행합니다. 민감정보 노출, 의존성 취약점, DB 보안, 에러 처리, 로깅 보안을 병렬로 검사하고 종합 리포트를 생성합니다. "보안 검사", "security audit", "취약점 분석" 요청 시 사용합니다.
allowed-tools: Task, Read, Bash, Grep, Glob
---

# Security Audit Skill

프로젝트의 종합 보안 감사를 수행하는 스킬입니다.

## 실행 방식

**반드시 5개의 보안 서브에이전트를 병렬로 호출하세요.**

Task 도구를 사용하여 다음 5개 서브에이전트를 **동시에 병렬로** 호출합니다:

```
1. secret-scanner      - 민감 정보 노출 검사
2. dependency-auditor  - 의존성 보안 검사
3. db-security-checker - 데이터베이스 보안 검사
4. error-handling-checker - 에러 처리 보안 검사
5. logging-auditor     - 로깅 보안 검사
```

## 병렬 호출 방법

**중요**: 하나의 메시지에서 5개의 Task 도구 호출을 동시에 실행하세요.

각 서브에이전트 호출 시 프롬프트:
- `secret-scanner`: "프로젝트의 민감 정보 노출을 검사하고 간결하게 보고해주세요."
- `dependency-auditor`: "프로젝트의 의존성 보안 취약점을 검사하고 간결하게 보고해주세요."
- `db-security-checker`: "프로젝트의 데이터베이스 관련 코드 보안을 검사하고 간결하게 보고해주세요."
- `error-handling-checker`: "프로젝트의 에러 처리 보안을 검사하고 간결하게 보고해주세요."
- `logging-auditor`: "프로젝트의 로깅 보안을 검사하고 간결하게 보고해주세요."

## 결과 종합

모든 서브에이전트의 결과가 반환되면, 아래 형식으로 종합 리포트를 작성합니다:

```markdown
# 🔒 종합 보안 감사 리포트

## 전체 보안 등급: [CRITICAL / HIGH / MEDIUM / LOW / SECURE]

## 요약
| 검사 항목 | 위험도 | 발견 사항 |
|-----------|--------|-----------|
| 민감 정보 노출 | [등급] | [개수] 건 |
| 의존성 취약점 | [등급] | [개수] 건 |
| DB 보안 | [등급] | [개수] 건 |
| 에러 처리 | [등급] | [개수] 건 |
| 로깅 보안 | [등급] | [개수] 건 |

## 긴급 조치 필요 (CRITICAL/HIGH)
1. [구체적인 조치 사항]
2. [구체적인 조치 사항]

## 권장 개선 사항 (MEDIUM/LOW)
1. [개선 사항]
2. [개선 사항]

## 세부 결과

### 1. 민감 정보 노출 검사
[secret-scanner 결과 요약]

### 2. 의존성 보안 검사
[dependency-auditor 결과 요약]

### 3. DB 보안 검사
[db-security-checker 결과 요약]

### 4. 에러 처리 검사
[error-handling-checker 결과 요약]

### 5. 로깅 보안 검사
[logging-auditor 결과 요약]
```

## 토큰 효율성 규칙

1. **간결성 우선**: 각 서브에이전트 결과에서 핵심만 추출
2. **중복 제거**: 여러 검사에서 동일한 파일/이슈가 발견되면 통합
3. **우선순위 기반**: CRITICAL > HIGH > MEDIUM > LOW 순으로 정렬
4. **액션 중심**: 발견된 문제보다 해결 방법에 집중

## 위험도 판정 기준

| 등급 | 기준 |
|------|------|
| CRITICAL | 즉시 악용 가능한 취약점 (노출된 API 키, SQL Injection 등) |
| HIGH | 심각한 보안 위험 (취약한 의존성, 인증 우회 가능성) |
| MEDIUM | 잠재적 위험 (상세 에러 노출, 불완전한 로깅) |
| LOW | 모범 사례 미준수 (오래된 패키지, 개선 권장 사항) |
| SECURE | 검사 통과 |

## 전체 보안 등급 산정

- 하나라도 CRITICAL → 전체 CRITICAL
- CRITICAL 없고 HIGH 있음 → 전체 HIGH
- HIGH 없고 MEDIUM 있음 → 전체 MEDIUM
- MEDIUM 없고 LOW 있음 → 전체 LOW
- 모두 SECURE → 전체 SECURE
