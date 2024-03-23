
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE SCHEMA IF NOT EXISTS "public";

ALTER SCHEMA "public" OWNER TO "pg_database_owner";

CREATE OR REPLACE FUNCTION "public"."decrease_hashtag_holder_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$begin
  update hashtags
  set
    holder_count = holder_count - 1
  where
    hashtag = old.hashtag;
  return null;
end;$$;

ALTER FUNCTION "public"."decrease_hashtag_holder_count"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_contract_event"("p_chain" "text", "p_contract_type" "text", "p_block_number" bigint, "p_log_index" bigint) RETURNS TABLE("chain" "text", "contract_type" "text", "block_number" bigint, "log_index" bigint, "tx" "text", "event_name" "text", "args" "text"[], "wallet_address" "text", "asset_id" "text", "created_at" timestamp with time zone, "user_id" "uuid", "user_wallet_address" "text", "user_display_name" "text", "user_avatar" "text", "user_avatar_thumb" "text", "user_stored_avatar" "text", "user_stored_avatar_thumb" "text", "user_x_username" "text", "asset_name" "text", "asset_image_thumb" "text", "asset_stored_image_thumb" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.chain,
        e.contract_type,
        e.block_number,
        e.log_index,
        e.tx,
        e.event_name,
        e.args,
        e.wallet_address,
        e.asset_id,
        e.created_at,

        u.user_id,
        u.wallet_address as user_wallet_address,
        u.display_name as user_display_name,
        u.avatar as user_avatar,
        u.avatar_thumb as user_avatar_thumb,
        u.stored_avatar as user_stored_avatar,
        u.stored_avatar_thumb as user_stored_avatar_thumb,
        u.x_username as user_x_username,

        a.asset_name,
        a.asset_image_thumb,
        a.asset_stored_image_thumb
    FROM 
        "public"."contract_events" e
    LEFT JOIN 
        "public"."users_public" u ON e.wallet_address = u.wallet_address
    LEFT JOIN 
        LATERAL (
            SELECT
                hashtag as asset_id,
                hashtag as asset_name,
                image_thumb as asset_image_thumb,
                null as asset_stored_image_thumb
            FROM public.hashtags WHERE e.contract_type = 'hashtag-trade' AND hashtag = e.asset_id
        ) a ON e.asset_id = a.asset_id
    WHERE
        e.chain = p_chain AND
        e.contract_type = p_contract_type AND
        e.block_number = p_block_number AND
        e.log_index = p_log_index;
END;
$$;

ALTER FUNCTION "public"."get_contract_event"("p_chain" "text", "p_contract_type" "text", "p_block_number" bigint, "p_log_index" bigint) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_contract_events_recently"("last_created_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "max_count" integer DEFAULT 100) RETURNS TABLE("chain" "text", "contract_type" "text", "block_number" bigint, "log_index" bigint, "tx" "text", "event_name" "text", "args" "text"[], "wallet_address" "text", "asset_id" "text", "created_at" timestamp with time zone, "user_id" "uuid", "user_wallet_address" "text", "user_display_name" "text", "user_avatar" "text", "user_avatar_thumb" "text", "user_stored_avatar" "text", "user_stored_avatar_thumb" "text", "user_x_username" "text", "asset_name" "text", "asset_image_thumb" "text", "asset_stored_image_thumb" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.chain,
        e.contract_type,
        e.block_number,
        e.log_index,
        e.tx,
        e.event_name,
        e.args,
        e.wallet_address,
        e.asset_id,
        e.created_at,

        u.user_id,
        u.wallet_address as user_wallet_address,
        u.display_name as user_display_name,
        u.avatar as user_avatar,
        u.avatar_thumb as user_avatar_thumb,
        u.stored_avatar as user_stored_avatar,
        u.stored_avatar_thumb as user_stored_avatar_thumb,
        u.x_username as user_x_username,

        a.asset_name,
        a.asset_image_thumb,
        a.asset_stored_image_thumb
    FROM 
        "public"."contract_events" e
    LEFT JOIN 
        "public"."users_public" u ON e.wallet_address = u.wallet_address
    LEFT JOIN 
        LATERAL (
            SELECT
                hashtag as asset_id,
                hashtag as asset_name,
                image_thumb as asset_image_thumb,
                null as asset_stored_image_thumb
            FROM public.hashtags WHERE e.contract_type = 'hashtag-trade' AND hashtag = e.asset_id
        ) a ON e.asset_id = a.asset_id
    WHERE
        (last_created_at IS NULL OR e.created_at < last_created_at)
        AND e.event_name IN ('TicketCreated', 'TicketDeleted', 'Trade')
    ORDER BY 
        e.created_at DESC
    LIMIT 
        max_count;
END;
$$;

ALTER FUNCTION "public"."get_contract_events_recently"("last_created_at" timestamp with time zone, "max_count" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_hashtag_leaderboard"("last_rank" integer DEFAULT NULL::integer, "max_count" integer DEFAULT 100) RETURNS TABLE("rank" integer, "hashtag" "text", "image" "text", "image_thumb" "text", "metadata" "jsonb", "supply" bigint, "total_trading_volume" "text", "is_price_up" boolean, "last_message_id" bigint, "last_message_sender" "text", "last_message" "text", "last_message_sent_at" timestamp with time zone, "holder_count" integer, "last_purchased_at" timestamp with time zone, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    row_rank integer;
BEGIN
    row_rank := COALESCE(last_rank, 0);
    RETURN QUERY
    SELECT
        (row_number() OVER (ORDER BY h.supply DESC) + row_rank)::integer AS rank,
        h.hashtag,
        h.image,
        h.image_thumb,
        h.metadata,
        h.supply,
        h.total_trading_volume::text,
        h.is_price_up,
        h.last_message_id,
        h.last_message_sender,
        h.last_message,
        h.last_message_sent_at,
        h.holder_count,
        h.last_purchased_at,
        h.created_at,
        h.updated_at
    FROM 
        public.hashtags h
    ORDER BY 
        h.supply DESC, h.holder_count DESC
    OFFSET 
        row_rank
    LIMIT 
        max_count;
END;
$$;

ALTER FUNCTION "public"."get_hashtag_leaderboard"("last_rank" integer, "max_count" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_holding_hashtags"("p_wallet_address" "text") RETURNS TABLE("hashtag" "text", "image" "text", "image_thumb" "text", "metadata" "jsonb", "supply" bigint, "total_trading_volume" "text", "is_price_up" boolean, "last_message_id" bigint, "last_message_sender" "text", "last_message" "text", "last_message_sent_at" timestamp with time zone, "holder_count" integer, "last_purchased_at" timestamp with time zone, "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "balance" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        h.hashtag,
        h.image,
        h.image_thumb,
        h.metadata,
        h.supply,
        h.total_trading_volume::text,
        h.is_price_up,
        h.last_message_id,
        h.last_message_sender,
        h.last_message,
        h.last_message_sent_at,
        h.holder_count,
        h.last_purchased_at,
        h.created_at,
        h.updated_at,
        hh.last_fetched_balance
    FROM 
        public.hashtags h
    JOIN 
        public.hashtag_holders hh ON h.hashtag = hh.hashtag AND hh.wallet_address = p_wallet_address
    WHERE 
        hh.wallet_address = p_wallet_address
    ORDER BY 
        hh.last_fetched_balance DESC;
END;
$$;

ALTER FUNCTION "public"."get_holding_hashtags"("p_wallet_address" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."increase_hashtag_holder_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$begin
  update hashtags
  set
    holder_count = holder_count + 1
  where
    hashtag = new.hashtag;
  return null;
end;$$;

ALTER FUNCTION "public"."increase_hashtag_holder_count"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."parse_contract_event"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF new.contract_type = 'hashtag-trade' THEN
        IF new.event_name = 'Trade' THEN

            -- buy
            IF new.args[3] = 'true' THEN

                insert into hashtags (
                    hashtag, supply, total_trading_volume, is_price_up, last_purchased_at
                ) values (
                    new.asset_id, new.args[9]::bigint, new.args[5]::numeric, true, now()
                ) on conflict (hashtag) do update
                    set supply = new.args[9]::bigint,
                    total_trading_volume = hashtags.total_trading_volume + new.args[5]::numeric,
                    is_price_up = true,
                    last_purchased_at = now();
                
                insert into hashtag_holders (
                    hashtag, wallet_address, last_fetched_balance
                ) values (
                    new.asset_id, new.args[1], new.args[4]::bigint
                ) on conflict (hashtag, wallet_address) do update
                    set last_fetched_balance = hashtag_holders.last_fetched_balance + new.args[4]::bigint;

                insert into user_wallets (
                    wallet_address, total_asset_balance
                ) values (
                    new.args[1], new.args[4]::bigint
                ) on conflict (wallet_address) do update
                    set total_asset_balance = user_wallets.total_asset_balance + new.args[4]::bigint;

            -- sell
            ELSE

                update hashtags set
                    supply = new.args[9]::bigint,
                    total_trading_volume = hashtags.total_trading_volume + new.args[5]::numeric,
                    is_price_up = false
                where hashtag = new.asset_id;

                UPDATE hashtag_holders
                SET last_fetched_balance = hashtag_holders.last_fetched_balance - new.args[4]::bigint
                WHERE hashtag = new.asset_id
                AND wallet_address = new.args[1];

                DELETE FROM hashtag_holders WHERE last_fetched_balance = 0;

                update user_wallets set
                    total_asset_balance = user_wallets.total_asset_balance - new.args[4]::bigint
                where wallet_address = new.args[1];

            END IF;

        ELSIF new.event_name = 'ClaimHolderFee' THEN

            insert into user_wallets (
                wallet_address
            ) values (
                new.args[1]
            ) on conflict (wallet_address) do nothing;

            update user_wallets set
                total_earned_trading_fees = total_earned_trading_fees + new.args[3]::numeric
            where
                wallet_address = new.args[1];

        END IF;
    END IF;
    RETURN NULL;
end;$$;

ALTER FUNCTION "public"."parse_contract_event"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."set_hashtag_last_message"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_new_id INT;
begin
  insert into hashtags (
    hashtag,
    last_message_id,
    last_message_sender,
    last_message,
    last_message_sent_at
  ) values (
    new.hashtag,
    0,
    (SELECT display_name FROM public.users_public WHERE user_id = new.author),
    new.message,
    now()
  ) on conflict (hashtag) do update
    set
        last_message_id = CASE WHEN hashtags.last_message_id is null THEN 0 ELSE hashtags.last_message_id + 1 END,
        last_message_sender = (SELECT display_name FROM public.users_public WHERE user_id = new.author),
        last_message = new.message,
        last_message_sent_at = now()
  RETURNING last_message_id INTO v_new_id;

  new.id = v_new_id;
  return new;
end;$$;

ALTER FUNCTION "public"."set_hashtag_last_message"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
  new.updated_at := now();
  RETURN new;
END;$$;

ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."set_user_metadata_to_public"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if strpos(new.raw_user_meta_data ->> 'iss', 'twitter') > 0 then
    insert into public.users_public (user_id, display_name, avatar, avatar_thumb, avatar_stored, x_username)
    values (
      new.id,
      new.raw_user_meta_data ->> 'full_name',
      case 
        when strpos(new.raw_user_meta_data ->> 'avatar_url', '_normal') > 0 then
          replace(new.raw_user_meta_data ->> 'avatar_url', '_normal', '')
        else
          new.raw_user_meta_data ->> 'avatar_url'
      end,
      new.raw_user_meta_data ->> 'avatar_url',
      false,
      new.raw_user_meta_data ->> 'user_name'
    ) on conflict (user_id) do update
    set
      display_name = new.raw_user_meta_data ->> 'full_name',
      avatar = case 
        when strpos(new.raw_user_meta_data ->> 'avatar_url', '_normal') > 0 then
          replace(new.raw_user_meta_data ->> 'avatar_url', '_normal', '')
        else
          new.raw_user_meta_data ->> 'avatar_url'
      end,
      avatar_thumb = new.raw_user_meta_data ->> 'avatar_url',
      avatar_stored = false,
      x_username = new.raw_user_meta_data ->> 'user_name';
  else
    insert into public.users_public (user_id, display_name, avatar, avatar_thumb, avatar_stored)
    values (
      new.id,
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'avatar_url',
      false
    ) on conflict (user_id) do update
    set
      display_name = new.raw_user_meta_data ->> 'full_name',
      avatar = new.raw_user_meta_data ->> 'avatar_url',
      avatar_thumb = new.raw_user_meta_data ->> 'avatar_url',
      avatar_stored = false;
  end if;
  return new;
end;
$$;

ALTER FUNCTION "public"."set_user_metadata_to_public"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."admins" (
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."admins" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."banned_users" (
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "ban_reason" "text",
    "ban_duration" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."banned_users" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."contract_events" (
    "chain" "text" NOT NULL,
    "contract_type" "text" NOT NULL,
    "block_number" bigint NOT NULL,
    "log_index" bigint NOT NULL,
    "tx" "text" NOT NULL,
    "event_name" "text" NOT NULL,
    "args" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "wallet_address" "text",
    "asset_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."contract_events" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."fcm_subscribed_topics" (
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "topic" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone
);

ALTER TABLE "public"."fcm_subscribed_topics" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."fcm_tokens" (
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "token" "text" NOT NULL,
    "subscribed_topics" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone
);

ALTER TABLE "public"."fcm_tokens" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."feedbacks" (
    "id" bigint NOT NULL,
    "user_id" "uuid",
    "feedback" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."feedbacks" OWNER TO "postgres";

ALTER TABLE "public"."feedbacks" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."feedbacks_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."hashtag_chat_users" (
    "hashtag" "text" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "last_seen_message_id" bigint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone
);

ALTER TABLE "public"."hashtag_chat_users" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."hashtag_holders" (
    "hashtag" "text" NOT NULL,
    "wallet_address" "text" NOT NULL,
    "last_fetched_balance" bigint DEFAULT '0'::bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone
);

ALTER TABLE "public"."hashtag_holders" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."hashtag_messages" (
    "id" bigint NOT NULL,
    "hashtag" "text" NOT NULL,
    "source" "text" NOT NULL,
    "author" "uuid" DEFAULT "auth"."uid"(),
    "external_author_id" "text",
    "external_author_name" "text",
    "external_author_avatar" "text",
    "message" "text",
    "external_message_id" "text",
    "translated" "jsonb",
    "rich" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."hashtag_messages" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."hashtags" (
    "hashtag" "text" NOT NULL,
    "image" "text",
    "image_thumb" "text",
    "metadata" "jsonb",
    "supply" bigint DEFAULT '0'::bigint NOT NULL,
    "total_trading_volume" numeric DEFAULT '0'::numeric NOT NULL,
    "is_price_up" boolean,
    "last_message" "text",
    "last_message_sent_at" timestamp with time zone DEFAULT '-infinity'::timestamp with time zone NOT NULL,
    "holder_count" integer DEFAULT 0 NOT NULL,
    "last_purchased_at" timestamp with time zone DEFAULT '-infinity'::timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "last_message_id" bigint,
    "last_message_sender" "text"
);

ALTER TABLE "public"."hashtags" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."tracked_event_blocks" (
    "chain" "text" NOT NULL,
    "contract_type" "text" NOT NULL,
    "block_number" bigint NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."tracked_event_blocks" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."user_devices" (
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "device_id" "text" NOT NULL,
    "device_type" "text" NOT NULL,
    "device_name" "text",
    "fcm_token" "text",
    "subscribed_topics" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone
);

ALTER TABLE "public"."user_devices" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."user_wallets" (
    "wallet_address" "text" NOT NULL,
    "total_asset_balance" bigint DEFAULT '0'::bigint NOT NULL,
    "total_earned_trading_fees" numeric DEFAULT '0'::numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone
);

ALTER TABLE "public"."user_wallets" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."users_public" (
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "wallet_address" "text",
    "display_name" "text",
    "avatar" "text",
    "avatar_thumb" "text",
    "avatar_stored" boolean DEFAULT false NOT NULL,
    "stored_avatar" "text",
    "stored_avatar_thumb" "text",
    "x_username" "text",
    "metadata" "jsonb",
    "points" integer DEFAULT 0 NOT NULL,
    "deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "wallet_type" "text",
    "last_sign_in_at" timestamp with time zone
);

ALTER TABLE "public"."users_public" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."wallet_linking_nonces" (
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "wallet_address" "text" NOT NULL,
    "nonce" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."wallet_linking_nonces" OWNER TO "postgres";

ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("user_id");

ALTER TABLE ONLY "public"."banned_users"
    ADD CONSTRAINT "banned_users_pkey" PRIMARY KEY ("user_id");

ALTER TABLE ONLY "public"."contract_events"
    ADD CONSTRAINT "contract_events_pkey" PRIMARY KEY ("chain", "contract_type", "block_number", "log_index");

ALTER TABLE ONLY "public"."fcm_subscribed_topics"
    ADD CONSTRAINT "fcm_subscribed_topics_pkey" PRIMARY KEY ("user_id", "topic");

ALTER TABLE ONLY "public"."fcm_tokens"
    ADD CONSTRAINT "fcm_tokens_pkey" PRIMARY KEY ("user_id", "token");

ALTER TABLE ONLY "public"."feedbacks"
    ADD CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."hashtag_chat_users"
    ADD CONSTRAINT "hashtag_chat_users_pkey" PRIMARY KEY ("hashtag", "user_id");

ALTER TABLE ONLY "public"."hashtag_holders"
    ADD CONSTRAINT "hashtag_holders_pkey" PRIMARY KEY ("hashtag", "wallet_address");

ALTER TABLE ONLY "public"."hashtag_messages"
    ADD CONSTRAINT "hashtag_messages_pkey" PRIMARY KEY ("id", "hashtag");

ALTER TABLE ONLY "public"."hashtags"
    ADD CONSTRAINT "hashtags_pkey" PRIMARY KEY ("hashtag");

ALTER TABLE ONLY "public"."tracked_event_blocks"
    ADD CONSTRAINT "tracked_event_blocks_pkey" PRIMARY KEY ("chain", "contract_type");

ALTER TABLE ONLY "public"."user_devices"
    ADD CONSTRAINT "user_devices_pkey" PRIMARY KEY ("user_id", "device_id");

ALTER TABLE ONLY "public"."user_wallets"
    ADD CONSTRAINT "user_wallets_pkey" PRIMARY KEY ("wallet_address");

ALTER TABLE ONLY "public"."users_public"
    ADD CONSTRAINT "users_public_pkey" PRIMARY KEY ("user_id");

ALTER TABLE ONLY "public"."users_public"
    ADD CONSTRAINT "users_public_wallet_address_key" UNIQUE ("wallet_address");

ALTER TABLE ONLY "public"."wallet_linking_nonces"
    ADD CONSTRAINT "wallet_linking_nonces_pkey" PRIMARY KEY ("user_id");

CREATE OR REPLACE TRIGGER "decrease_hashtag_holder_count" AFTER DELETE ON "public"."hashtag_holders" FOR EACH ROW EXECUTE FUNCTION "public"."decrease_hashtag_holder_count"();

CREATE OR REPLACE TRIGGER "increase_hashtag_holder_count" AFTER INSERT ON "public"."hashtag_holders" FOR EACH ROW EXECUTE FUNCTION "public"."increase_hashtag_holder_count"();

CREATE OR REPLACE TRIGGER "insert_contract_event_webhook" AFTER INSERT ON "public"."contract_events" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://jdrnvhppizwxhjjhisxd.supabase.co/functions/v1/insert-contract-event-webhook', 'POST', '{"Content-type":"application/json"}', '{"secret":"b838f2d9-f641-4251-a769-5b83fdce5934"}', '1000');

CREATE OR REPLACE TRIGGER "parse_contract_event" AFTER INSERT ON "public"."contract_events" FOR EACH ROW EXECUTE FUNCTION "public"."parse_contract_event"();

CREATE OR REPLACE TRIGGER "set_hashtag_holders_updated_at" BEFORE UPDATE ON "public"."hashtag_holders" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

CREATE OR REPLACE TRIGGER "set_hashtag_last_message" BEFORE INSERT ON "public"."hashtag_messages" FOR EACH ROW EXECUTE FUNCTION "public"."set_hashtag_last_message"();

CREATE OR REPLACE TRIGGER "set_hashtags_updated_at" BEFORE UPDATE ON "public"."hashtags" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

CREATE OR REPLACE TRIGGER "set_tracked_event_blocks_updated_at" BEFORE UPDATE ON "public"."tracked_event_blocks" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

CREATE OR REPLACE TRIGGER "set_user_wallets_updated_at" BEFORE UPDATE ON "public"."user_wallets" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

CREATE OR REPLACE TRIGGER "set_users_public_updated_at" BEFORE UPDATE ON "public"."users_public" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users_public"("user_id");

ALTER TABLE ONLY "public"."banned_users"
    ADD CONSTRAINT "banned_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users_public"("user_id");

ALTER TABLE ONLY "public"."fcm_subscribed_topics"
    ADD CONSTRAINT "fcm_subscribed_topics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users_public"("user_id");

ALTER TABLE ONLY "public"."fcm_tokens"
    ADD CONSTRAINT "fcm_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users_public"("user_id");

ALTER TABLE ONLY "public"."feedbacks"
    ADD CONSTRAINT "feedbacks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users_public"("user_id");

ALTER TABLE ONLY "public"."hashtag_messages"
    ADD CONSTRAINT "hashtag_chat_messages_author_fkey" FOREIGN KEY ("author") REFERENCES "public"."users_public"("user_id");

ALTER TABLE ONLY "public"."user_devices"
    ADD CONSTRAINT "user_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users_public"("user_id");

ALTER TABLE ONLY "public"."users_public"
    ADD CONSTRAINT "users_public_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."wallet_linking_nonces"
    ADD CONSTRAINT "wallet_linking_nonces_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users_public"("user_id");

ALTER TABLE "public"."admins" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."banned_users" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "can view only admin" ON "public"."feedbacks" FOR SELECT TO "authenticated" USING ((( SELECT "admins"."user_id"
   FROM "public"."admins"
  WHERE ("admins"."user_id" = "auth"."uid"())) IS NOT NULL));

CREATE POLICY "can view only user" ON "public"."fcm_subscribed_topics" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));

CREATE POLICY "can view only user" ON "public"."fcm_tokens" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));

CREATE POLICY "can write everyone" ON "public"."feedbacks" FOR INSERT WITH CHECK (true);

CREATE POLICY "can write only authed" ON "public"."hashtag_messages" FOR INSERT TO "authenticated" WITH CHECK ((("length"("hashtag") <= 32) AND ((("message" IS NOT NULL) AND ("message" <> ''::"text") AND ("length"("message") <= 1000)) OR (("message" IS NULL) AND ("rich" IS NOT NULL))) AND ("author" = "auth"."uid"()) AND (( SELECT "banned_users"."user_id"
   FROM "public"."banned_users"
  WHERE ("banned_users"."user_id" = "auth"."uid"())) IS NULL)));

CREATE POLICY "check hashtag length" ON "public"."hashtag_holders" FOR INSERT WITH CHECK (("length"("hashtag") <= 32));

CREATE POLICY "check hashtag length" ON "public"."hashtags" FOR INSERT WITH CHECK (("length"("hashtag") <= 32));

ALTER TABLE "public"."contract_events" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."fcm_subscribed_topics" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."fcm_tokens" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."feedbacks" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."hashtag_chat_users" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."hashtag_holders" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."hashtag_messages" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."hashtags" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "only authed" ON "public"."hashtag_chat_users" FOR INSERT TO "authenticated" WITH CHECK ((("length"("hashtag") <= 32) AND ("user_id" = "auth"."uid"())));

CREATE POLICY "only user" ON "public"."hashtag_chat_users" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));

ALTER TABLE "public"."tracked_event_blocks" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."user_devices" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."user_wallets" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."users_public" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view everyone" ON "public"."contract_events" FOR SELECT USING (true);

CREATE POLICY "view everyone" ON "public"."hashtag_chat_users" FOR SELECT USING (true);

CREATE POLICY "view everyone" ON "public"."hashtag_holders" FOR SELECT USING (true);

CREATE POLICY "view everyone" ON "public"."hashtag_messages" FOR SELECT USING (true);

CREATE POLICY "view everyone" ON "public"."hashtags" FOR SELECT USING (true);

CREATE POLICY "view everyone" ON "public"."user_wallets" FOR SELECT USING (true);

CREATE POLICY "view everyone" ON "public"."users_public" FOR SELECT USING (true);

ALTER TABLE "public"."wallet_linking_nonces" ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."decrease_hashtag_holder_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."decrease_hashtag_holder_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrease_hashtag_holder_count"() TO "service_role";

GRANT ALL ON FUNCTION "public"."get_contract_event"("p_chain" "text", "p_contract_type" "text", "p_block_number" bigint, "p_log_index" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_contract_event"("p_chain" "text", "p_contract_type" "text", "p_block_number" bigint, "p_log_index" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_contract_event"("p_chain" "text", "p_contract_type" "text", "p_block_number" bigint, "p_log_index" bigint) TO "service_role";

GRANT ALL ON FUNCTION "public"."get_contract_events_recently"("last_created_at" timestamp with time zone, "max_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_contract_events_recently"("last_created_at" timestamp with time zone, "max_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_contract_events_recently"("last_created_at" timestamp with time zone, "max_count" integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."get_hashtag_leaderboard"("last_rank" integer, "max_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_hashtag_leaderboard"("last_rank" integer, "max_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_hashtag_leaderboard"("last_rank" integer, "max_count" integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."get_holding_hashtags"("p_wallet_address" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_holding_hashtags"("p_wallet_address" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_holding_hashtags"("p_wallet_address" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."increase_hashtag_holder_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."increase_hashtag_holder_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increase_hashtag_holder_count"() TO "service_role";

GRANT ALL ON FUNCTION "public"."parse_contract_event"() TO "anon";
GRANT ALL ON FUNCTION "public"."parse_contract_event"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."parse_contract_event"() TO "service_role";

GRANT ALL ON FUNCTION "public"."set_hashtag_last_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_hashtag_last_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_hashtag_last_message"() TO "service_role";

GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";

GRANT ALL ON FUNCTION "public"."set_user_metadata_to_public"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_user_metadata_to_public"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_user_metadata_to_public"() TO "service_role";

GRANT ALL ON TABLE "public"."admins" TO "anon";
GRANT ALL ON TABLE "public"."admins" TO "authenticated";
GRANT ALL ON TABLE "public"."admins" TO "service_role";

GRANT ALL ON TABLE "public"."banned_users" TO "anon";
GRANT ALL ON TABLE "public"."banned_users" TO "authenticated";
GRANT ALL ON TABLE "public"."banned_users" TO "service_role";

GRANT ALL ON TABLE "public"."contract_events" TO "anon";
GRANT ALL ON TABLE "public"."contract_events" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_events" TO "service_role";

GRANT ALL ON TABLE "public"."fcm_subscribed_topics" TO "anon";
GRANT ALL ON TABLE "public"."fcm_subscribed_topics" TO "authenticated";
GRANT ALL ON TABLE "public"."fcm_subscribed_topics" TO "service_role";

GRANT ALL ON TABLE "public"."fcm_tokens" TO "anon";
GRANT ALL ON TABLE "public"."fcm_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."fcm_tokens" TO "service_role";

GRANT ALL ON TABLE "public"."feedbacks" TO "anon";
GRANT ALL ON TABLE "public"."feedbacks" TO "authenticated";
GRANT ALL ON TABLE "public"."feedbacks" TO "service_role";

GRANT ALL ON SEQUENCE "public"."feedbacks_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."feedbacks_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."feedbacks_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."hashtag_chat_users" TO "anon";
GRANT ALL ON TABLE "public"."hashtag_chat_users" TO "authenticated";
GRANT ALL ON TABLE "public"."hashtag_chat_users" TO "service_role";

GRANT ALL ON TABLE "public"."hashtag_holders" TO "anon";
GRANT ALL ON TABLE "public"."hashtag_holders" TO "authenticated";
GRANT ALL ON TABLE "public"."hashtag_holders" TO "service_role";

GRANT ALL ON TABLE "public"."hashtag_messages" TO "anon";
GRANT ALL ON TABLE "public"."hashtag_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."hashtag_messages" TO "service_role";

GRANT ALL ON TABLE "public"."hashtags" TO "anon";
GRANT ALL ON TABLE "public"."hashtags" TO "authenticated";
GRANT ALL ON TABLE "public"."hashtags" TO "service_role";

GRANT ALL ON TABLE "public"."tracked_event_blocks" TO "anon";
GRANT ALL ON TABLE "public"."tracked_event_blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."tracked_event_blocks" TO "service_role";

GRANT ALL ON TABLE "public"."user_devices" TO "anon";
GRANT ALL ON TABLE "public"."user_devices" TO "authenticated";
GRANT ALL ON TABLE "public"."user_devices" TO "service_role";

GRANT ALL ON TABLE "public"."user_wallets" TO "anon";
GRANT ALL ON TABLE "public"."user_wallets" TO "authenticated";
GRANT ALL ON TABLE "public"."user_wallets" TO "service_role";

GRANT ALL ON TABLE "public"."users_public" TO "anon";
GRANT ALL ON TABLE "public"."users_public" TO "authenticated";
GRANT ALL ON TABLE "public"."users_public" TO "service_role";

GRANT ALL ON TABLE "public"."wallet_linking_nonces" TO "anon";
GRANT ALL ON TABLE "public"."wallet_linking_nonces" TO "authenticated";
GRANT ALL ON TABLE "public"."wallet_linking_nonces" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";

RESET ALL;
