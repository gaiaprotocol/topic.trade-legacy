## 프로젝트 초기화
```
supabase init
supabase link --project-ref XXX
```

## 환경변수 설정
```
supabase secrets set --env-file ./supabase/.env
supabase secrets set --env-file ./supabase/.env.development
```

## Edge Function 배포
```
supabase functions deploy store-user-avatar
supabase functions deploy new-wallet-linking-nonce
supabase functions deploy link-wallet-to-user
supabase functions deploy store-fcm-token
supabase functions deploy track-contract-events
supabase functions deploy insert-data-webhook --no-verify-jwt
```

## 데이터베이스 구조 백업
```
supabase db dump -f supabase/seed.sql
```

## Postgres Cron 정보 보기
```sql
select * from cron.job; -- 스케줄 목록
select * from cron.job_run_details; -- 스케줄 실행 이력
```
