import { serveWithOptions } from "../_shared/cors.ts";
import { sendFcmToSpecificUser } from "../_shared/fcm.ts";
import supabase, { isDevMode } from "../_shared/supabase.ts";

interface ContractEvent {
  chain: string;
  contract_type: string;
  block_number: number;
  log_index: number;
  tx: string;
  event_name: string;
  args: string[];
  wallet_address?: string;
  asset_id?: string;
  created_at: string;
}

interface Feedback {
  user_id?: string;
  feedback: string;
  created_at: string;
}

interface HashtagMessage {
  hashtag: string;
  author: string;
  message?: string;
  rich?: {
    files?: {
      url: string;
      fileName: string;
      fileType: string;
      fileSize: number;
    }[];
  };
}

interface InsertPayload {
  type: "INSERT";
  table: string;
  schema: string;
  record: ContractEvent | HashtagMessage | Feedback;
  old_record: null;
}

function shortenEthereumAddress(address: string) {
  if (address.length !== 42 || !address.startsWith("0x")) return address;
  return `${address.substring(0, 6)}...${address.substring(38)}`;
}

function numberWithCommas(x: string, fixed?: number) {
  if (fixed === undefined || +(+x) > Number.MAX_SAFE_INTEGER) {
    const parts = x.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts[1] === "0" ? parts[0] : parts.join(".");
  }
  const parts = String(+(+x).toFixed(fixed)).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

async function findHashtagSubscribedTokens(
  hashtag: string,
  exceptUser: string | undefined,
): Promise<string[]> {
  const { data: subs, error: getSubsError } = await supabase.from(
    "subscribed_hashtags",
  ).select("user_id").eq("hashtag", hashtag).neq("user_id", exceptUser);
  if (getSubsError) throw getSubsError;

  const { data: tokens, error: getTokensError } = await supabase.from(
    "fcm_tokens",
  ).select("token").in(
    "user_id",
    subs.map((holder) => holder.user_id),
  );
  if (getTokensError) throw getTokensError;

  return tokens.map((t) => t.token);
}

serveWithOptions(async (req) => {
  const u = new URL(req.url);
  const secret = u.searchParams.get("secret");
  if (!secret || secret !== Deno.env.get("INTERNAL_ACCESS_KEY")!) {
    throw new Error("Unauthorized");
  }

  const payload: InsertPayload = await req.json();
  if (isDevMode) console.log(payload);

  if (payload.type === "INSERT" && payload.table === "contract_events") {
    const data = payload.record as ContractEvent;

    const { data: users, error: getUserError } = await supabase.from(
      "users_public",
    ).select("user_id, display_name, stored_avatar_thumb").eq(
      "wallet_address",
      data.wallet_address,
    );
    if (getUserError) throw getUserError;
    const user = users[0];

    const tokens = await findHashtagSubscribedTokens(
      data.asset_id!,
      user?.user_id,
    );

    if (data.contract_type === "hashtag-trade") {
      if (data.args[2] === "true") { // buy
        for (const token of tokens) {
          try {
            await sendFcmToSpecificUser(token, {
              tag: `hashtag_${data.asset_id}`,
              title: "New trade",
              body: `${
                user
                  ? user.display_name
                  : shortenEthereumAddress(data.wallet_address ?? "")
              } bought ${numberWithCommas(data.args[3])} ${data.asset_id} ${
                Deno.env.get("HASHTAG_UNIT")
              }.`,
              icon: user?.stored_avatar_thumb,
            }, {
              redirectTo: `/${data.asset_id}`,
            });
          } catch (e) {
            console.error(e);
          }
        }
      } else {
        for (const token of tokens) {
          try {
            await sendFcmToSpecificUser(token, {
              tag: `hashtag_${data.asset_id}`,
              title: "New trade",
              body: `${
                user
                  ? user.display_name
                  : shortenEthereumAddress(data.wallet_address ?? "")
              } sold ${numberWithCommas(data.args[3])} ${data.asset_id} ${
                Deno.env.get("HASHTAG_UNIT")
              }.`,
              icon: user?.stored_avatar_thumb,
            }, {
              redirectTo: `/${data.asset_id}`,
            });
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
  } else if (
    payload.type === "INSERT" && payload.table === "hashtag_messages"
  ) {
    const data = payload.record as HashtagMessage;
    const { data: users, error: getUserError } = await supabase.from(
      "users_public",
    ).select("user_id, display_name, stored_avatar_thumb").eq(
      "user_id",
      data.author,
    );
    if (getUserError) throw getUserError;
    const user = users[0];

    const tokens = await findHashtagSubscribedTokens(
      data.hashtag,
      user?.user_id,
    );

    if (data.message) {
      for (const token of tokens) {
        try {
          await sendFcmToSpecificUser(token, {
            tag: `hashtag_${data.hashtag}`,
            title: user?.display_name,
            body: data.message,
            icon: user?.stored_avatar_thumb,
          }, {
            redirectTo: `/${data.hashtag}`,
          });
        } catch (e) {
          console.error(e);
        }
      }
    } else if (data.rich?.files?.length) {
      for (const token of tokens) {
        try {
          await sendFcmToSpecificUser(token, {
            tag: `hashtag_${data.hashtag}`,
            title: user?.display_name,
            body: "Sent a file",
            icon: user?.stored_avatar_thumb,
          }, {
            redirectTo: `/${data.hashtag}`,
          });
        } catch (e) {
          console.error(e);
        }
      }
    }
  } else if (payload.type === "INSERT" && payload.table === "feedbacks") {
    const { data: admins, error: getAdminError } = await supabase.from("admins")
      .select("user_id");
    if (getAdminError) throw getAdminError;

    const { data: fcmTokens, error: getFcmTokensError } = await supabase.from(
      "fcm_tokens",
    ).select("token").in(
      "user_id",
      admins.map((admin) => admin.user_id),
    );
    if (getFcmTokensError) throw getFcmTokensError;

    for (const t of fcmTokens) {
      try {
        await sendFcmToSpecificUser(t.token, {
          tag: "feedback",
          title: "New feedback",
          body: (payload.record as Feedback).feedback,
        });
      } catch (e) {
        console.error(e);
      }
    }
  }
});
