import { User } from "https://esm.sh/@supabase/supabase-js@2.31.0";
import { ethers } from "https://esm.sh/ethers@6.7.0";
import ERC20Contract from "../_shared/contracts/ERC20Contract.ts";
import { serveWithOptions } from "../_shared/cors.ts";
import supabase, { getSignedUser } from "../_shared/supabase.ts";

async function storeAvatar(user: User, userPublic: any) {
  const stored = userPublic.avatar_stored;
  if (stored === false) {
    let url: string | undefined = user.user_metadata.avatar_url;
    let thumbnailUrl: string | undefined;

    if (url?.includes("_normal")) {
      thumbnailUrl = url;
      url = url.replace("_normal", "");
    } else {
      thumbnailUrl = url;
    }

    if (url) {
      const result = await fetch(url);
      if (!result.body) throw new Error("Failed to fetch avatar");

      const { error: storeError } = await supabase.storage.from(
        "user_avatars",
      ).upload(
        `${user.id}/avatar.png`,
        result.body,
        { contentType: "image/png", upsert: true },
      );
      if (storeError) throw storeError;

      const { data: { publicUrl } } = supabase.storage.from(
        "user_avatars",
      ).getPublicUrl(`${user.id}/avatar.png`);

      url = publicUrl;
    }

    if (thumbnailUrl) {
      const result = await fetch(thumbnailUrl);
      if (!result.body) throw new Error("Failed to fetch avatar");

      const { error: storeError } = await supabase.storage.from(
        "user_avatars",
      ).upload(
        `${user.id}/avatar-thumbnail.png`,
        result.body,
        { contentType: "image/png", upsert: true },
      );
      if (storeError) throw storeError;

      const { data: { publicUrl } } = supabase.storage.from(
        "user_avatars",
      ).getPublicUrl(`${user.id}/avatar-thumbnail.png`);

      thumbnailUrl = publicUrl;
    }

    const { error: updateError } = await supabase.from("users_public").update({
      avatar_stored: true,
      stored_avatar: url?.startsWith("http://supabase_kong_sofia:8000/")
        ? url.replace(
          "http://supabase_kong_sofia:8000/",
          "http://localhost:54321/",
        )
        : url,
      stored_avatar_thumb:
        thumbnailUrl?.startsWith("http://supabase_kong_sofia:8000/")
          ? thumbnailUrl.replace(
            "http://supabase_kong_sofia:8000/",
            "http://localhost:54321/",
          )
          : thumbnailUrl,
      last_sign_in_at: new Date(),
    }).eq("user_id", user.id);
    if (updateError) throw updateError;
  } else {
    const { error: updateError } = await supabase.from("users_public").update({
      last_sign_in_at: new Date(),
    }).eq("user_id", user.id);
    if (updateError) throw updateError;
  }
}

const signers: { [chain: string]: ethers.Signer } = {};

function getSinger(chain: string) {
  if (!signers[chain]) {
    signers[chain] = new ethers.JsonRpcSigner(
      new ethers.JsonRpcProvider(
        Deno.env.get(`${chain.toUpperCase()}_RPC_URL`),
      ),
      ethers.ZeroAddress,
    );
  }
  return signers[chain];
}

async function checkCommunityMembership(userId: string, userPublic: any) {
  if (userPublic.wallet_address) {
    const { data: communityData, error: communityError } = await supabase.from(
      "communities",
    ).select("id, tokens");
    if (communityError) throw communityError;

    for (const community of communityData) {
      let hasMembership = false;
      const balances: { [chain: string]: { [token: string]: string } } = {};

      for (const token of community.tokens) {
        if (token.type === "erc20") {
          const balance = await new ERC20Contract(
            getSinger(token.chain),
            token.address,
          ).balanceOf(userPublic.wallet_address);

          if (!balances[token.chain]) balances[token.chain] = {};
          balances[token.chain][token.address] = balance.toString();

          if (
            balance >= ethers.parseEther(String(token.min_tokens_for_member))
          ) {
            hasMembership = true;
          }
        }
      }

      if (hasMembership) {
        const { error: upsertError } = await supabase.from("community_members")
          .upsert({
            community_id: community.id,
            user_id: userId,
            holding_tokens: balances,
          });
        if (upsertError) throw upsertError;
      } else {
        const { error: deleteError } = await supabase.from("community_members")
          .delete().eq("community_id", community.id).eq("user_id", userId);
        if (deleteError) throw deleteError;
      }
    }
  }
}

serveWithOptions(async (req) => {
  const user = await getSignedUser(req);
  if (!user) throw new Error("Unauthorized");

  const { data: usersPublicData, error: usersPublicError } = await supabase
    .from("users_public").select("avatar_stored, wallet_address").eq(
      "user_id",
      user.id,
    );
  if (usersPublicError) throw usersPublicError;
  const userPublic = usersPublicData?.[0];

  await Promise.all([
    storeAvatar(user, userPublic),
    Deno.env.get("COMMUNITY_FEATURES_ENABLED") === "true"
      ? checkCommunityMembership(user.id, userPublic)
      : Promise.resolve(),
  ]);
});
