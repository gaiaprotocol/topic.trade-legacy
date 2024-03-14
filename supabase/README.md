```
supabase link --project-ref XXX
```

```
supabase secrets set --env-file ./supabase/.env
```

```
supabase functions deploy store-user-avatar
supabase functions deploy new-wallet-linking-nonce
supabase functions deploy link-wallet-to-user
```

```
supabase db dump -f supabase/seed.sql
```