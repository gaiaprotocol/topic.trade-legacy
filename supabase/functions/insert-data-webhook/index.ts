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

interface CreatorMessage {
  creator_address: string;
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

interface Post {
  id: number;
  parent_post_id?: number;
  quoted_post_id?: number;
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

interface PostLike {
  post_id: number;
  user_id: string;
}

interface InsertPayload {
  type: "INSERT";
  table: string;
  schema: string;
  record:
    | ContractEvent
    | CreatorMessage
    | HashtagMessage
    | Feedback
    | Post
    | PostLike;
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

async function findCreatorSubscribedTokens(
  creatorAddress: string,
  exceptUser: string | undefined,
): Promise<[
  {
    user_id: string;
    display_name?: string;
  } | undefined,
  { user_id: string; token: string }[],
]> {
  const { data: holders, error: getHoldersError } = await supabase.from(
    "creator_holders",
  ).select("wallet_address").eq(
    "creator_address",
    creatorAddress,
  );
  if (getHoldersError) throw getHoldersError;

  const holderWalletAddresses = holders.map((holder) => holder.wallet_address);
  holderWalletAddresses.push(creatorAddress);

  const [
    { data: holderUsers, error: getHolderUsersError },
    { data: unsubs, error: getUnsubsError },
  ] = await Promise.all([
    supabase.from(
      "users_public",
    ).select("user_id, wallet_address, display_name").in(
      "wallet_address",
      holderWalletAddresses,
    ).neq("user_id", exceptUser),
    supabase.from("unsubscribed_creators").select("user_id").eq(
      "creator_address",
      creatorAddress,
    ),
  ]);

  if (getHolderUsersError) throw getHolderUsersError;
  if (getUnsubsError) throw getUnsubsError;

  const { data: tokens, error: getTokensError } = await supabase.from(
    "fcm_tokens",
  ).select("user_id, token").in(
    "user_id",
    holderUsers.map((holder) => holder.user_id).filter(
      (holder) => !unsubs.some((unsub) => unsub.user_id === holder),
    ),
  );
  if (getTokensError) throw getTokensError;

  return [
    holderUsers.find((u) => u.wallet_address === creatorAddress),
    tokens.map((t) => ({
      user_id: t.user_id,
      token: t.token,
    })),
  ];
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

    if (data.contract_type === "creator-trade") {
      const [creator, tokens] = await findCreatorSubscribedTokens(
        data.asset_id!,
        user?.user_id,
      );

      if (data.args[2] === "true") { // buy
        for (const t of tokens) {
          try {
            await sendFcmToSpecificUser(t.token, {
              tag: `creator_${data.asset_id}`,
              title: "New trade",
              body: `${
                user
                  ? user.display_name
                  : shortenEthereumAddress(data.wallet_address ?? "")
              } bought ${numberWithCommas(data.args[3])} ${
                creator?.user_id === t.user_id
                  ? "your"
                  : (creator?.display_name
                    ? creator.display_name
                    : shortenEthereumAddress(data.asset_id ?? ""))
              } ${Deno.env.get("CREATOR_UNIT")}${
                data.args[3] === "1" ? "" : "s"
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
        for (const t of tokens) {
          try {
            await sendFcmToSpecificUser(t.token, {
              tag: `creator_${data.asset_id}`,
              title: "New trade",
              body: `${
                user
                  ? user.display_name
                  : shortenEthereumAddress(data.wallet_address ?? "")
              } sold ${numberWithCommas(data.args[3])} ${
                creator?.user_id === t.user_id
                  ? "your"
                  : (creator?.display_name
                    ? creator.display_name
                    : shortenEthereumAddress(data.asset_id ?? ""))
              } ${Deno.env.get("CREATOR_UNIT")}${
                data.args[3] === "1" ? "" : "s"
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
    } else if (data.contract_type === "hashtag-trade") {
      const tokens = await findHashtagSubscribedTokens(
        data.asset_id!,
        user?.user_id,
      );

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
              }${data.args[3] === "1" ? "" : "s"}.`,
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
              }${data.args[3] === "1" ? "" : "s"}.`,
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
    payload.type === "INSERT" && payload.table === "creator_messages"
  ) {
    const data = payload.record as CreatorMessage;

    const { data: users, error: getUserError } = await supabase.from(
      "users_public",
    ).select("user_id, display_name, stored_avatar_thumb").eq(
      "user_id",
      data.author,
    );
    if (getUserError) throw getUserError;
    const user = users[0];

    const [creator, tokens] = await findCreatorSubscribedTokens(
      data.creator_address,
      user?.user_id,
    );

    if (data.message) {
      for (const t of tokens) {
        try {
          await sendFcmToSpecificUser(t.token, {
            tag: `creator_${data.creator_address}`,
            title: creator?.display_name
              ? creator.display_name
              : shortenEthereumAddress(data.creator_address),
            body: user?.display_name + ": " + data.message,
            icon: user?.stored_avatar_thumb,
          }, {
            redirectTo: `${
              Deno.env.get("CREATOR_BASE_URI")
            }/${data.creator_address}`,
          });
        } catch (e) {
          console.error(e);
        }
      }
    } else if (data.rich?.files?.length) {
      for (const t of tokens) {
        try {
          await sendFcmToSpecificUser(t.token, {
            tag: `creator_${data.creator_address}`,
            title: creator?.display_name
              ? creator.display_name
              : shortenEthereumAddress(data.creator_address),
            body: user?.display_name + " sent a file",
            icon: user?.stored_avatar_thumb,
          }, {
            redirectTo: `${
              Deno.env.get("CREATOR_BASE_URI")
            }/${data.creator_address}`,
          });
        } catch (e) {
          console.error(e);
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
            title: data.hashtag,
            body: user?.display_name + ": " + data.message,
            icon: user?.stored_avatar_thumb,
          }, {
            redirectTo: `${Deno.env.get("HASHTAG_BASE_URI")}/${data.hashtag}`,
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
            title: data.hashtag,
            body: user?.display_name + " sent a file",
            icon: user?.stored_avatar_thumb,
          }, {
            redirectTo: `${Deno.env.get("HASHTAG_BASE_URI")}/${data.hashtag}`,
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
  } else if (
    payload.type === "INSERT" && payload.table === "posts"
  ) {
    const data = payload.record as Post;

    if (data.parent_post_id) {
      const { data: posts, error: getPostsError } = await supabase.from("posts")
        .select("author").eq("id", data.parent_post_id);
      if (getPostsError) throw getPostsError;

      const { data: tokens, error: getTokensError } = await supabase.from(
        "fcm_tokens",
      ).select("token").eq("user_id", posts[0].author);
      if (getTokensError) throw getTokensError;

      const { data: users, error: getUsersError } = await supabase.from(
        "users_public",
      ).select("display_name").eq("user_id", data.author);
      if (getUsersError) throw getUsersError;

      for (const t of tokens) {
        try {
          await sendFcmToSpecificUser(t.token, {
            tag: "post_reply",
            title: "New reply",
            body: `${users[0].display_name} replied to your post.`,
          });
        } catch (e) {
          console.error(e);
        }
      }
    }

    if (data.quoted_post_id) {
      const { data: posts, error: getPostsError } = await supabase.from("posts")
        .select("author").eq("id", data.quoted_post_id);
      if (getPostsError) throw getPostsError;

      const { data: tokens, error: getTokensError } = await supabase.from(
        "fcm_tokens",
      ).select("token").eq("user_id", posts[0].author);
      if (getTokensError) throw getTokensError;

      const { data: users, error: getUsersError } = await supabase.from(
        "users_public",
      ).select("display_name").eq("user_id", data.author);
      if (getUsersError) throw getUsersError;

      const isRepost = data.message === null && data.rich === null;
      for (const t of tokens) {
        try {
          await sendFcmToSpecificUser(t.token, {
            tag: isRepost ? "post_repost" : "post_quote",
            title: isRepost ? "New repost" : "New quote",
            body: `${users[0].display_name} ${
              isRepost ? "reposted" : "quoted"
            } your post.`,
          });
        } catch (e) {
          console.error(e);
        }
      }
    }
  } else if (
    payload.type === "INSERT" && payload.table === "post_likes"
  ) {
    const data = payload.record as PostLike;
    const { data: posts, error: getPostsError } = await supabase.from("posts")
      .select("author").eq("id", data.post_id);
    if (getPostsError) throw getPostsError;

    const { data: tokens, error: getTokensError } = await supabase.from(
      "fcm_tokens",
    ).select("token").eq("user_id", posts[0].author);
    if (getTokensError) throw getTokensError;

    const { data: users, error: getUsersError } = await supabase.from(
      "users_public",
    ).select("display_name").eq("user_id", data.user_id);
    if (getUsersError) throw getUsersError;

    for (const t of tokens) {
      try {
        await sendFcmToSpecificUser(t.token, {
          tag: "post_like",
          title: "New like",
          body: `${users[0].display_name} liked your post.`,
        });
      } catch (e) {
        console.error(e);
      }
    }
  }
});
