## 프로젝트 초기화
```
supabase init
supabase link --project-ref XXX
```

## 환경변수 설정
```
supabase secrets set --env-file ./supabase/.env
```

## Edge Function 배포
```
supabase functions deploy store-user-avatar
supabase functions deploy new-wallet-linking-nonce
supabase functions deploy link-wallet-to-user
supabase functions deploy store-fcm-token
supabase functions deploy subscribe-fcm-topic
supabase functions deploy unsubscribe-fcm-topic
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

## Postgres Cron 스케줄 생성
```sql
select
  cron.schedule(
    'track-hashtag-trade-events',
    '*/10 * * * *',
    $$
    select net.http_post(
        'https://jdrnvhppizwxhjjhisxd.supabase.co/functions/v1/track-contract-events',
        body := '{"chain":"base","contractType":"hashtag-trade"}'::JSONB,
        headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impkcm52aHBwaXp3eGhqamhpc3hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDA0OTQ4MTcsImV4cCI6MjAxNjA3MDgxN30.z1v9yXN3iJxBANJ1K4z-aqnL3es_PGmpmdSDafid8oI"}'::JSONB
    ) AS request_id;
    $$
  );
```
