import { serveWithOptions } from "../_shared/cors.ts";
import supabase, { getSignedUser } from "../_shared/supabase.ts";

serveWithOptions(async (req) => {
  const { assetType, assetId, messageId, reaction } = await req.json();
  if (!assetType || !assetId || !messageId || !reaction) {
    throw new Error("Missing asset type, asset id, message id, or reaction");
  }

  const user = await getSignedUser(req);
  if (!user) throw new Error("Unauthorized");

  if (assetType === "creator") {
    const { data: reactionData, error: reactionDataError } = await supabase
      .from("creator_message_reactions").select("message_id").eq(
        "creator_address",
        assetId,
      ).eq("message_id", messageId).eq("reactor", user.id).eq(
        "reaction",
        reaction,
      );
    if (reactionDataError) throw reactionDataError;

    if (reactionData.length === 0) {
      const { error } = await supabase.from("creator_message_reactions").insert(
        [
          {
            creator_address: assetId,
            message_id: messageId,
            reactor: user.id,
            reaction,
          },
        ],
      );
      if (error) throw error;
    } else {
      const { error } = await supabase.from("creator_message_reactions")
        .delete().eq(
          "creator_address",
          assetId,
        ).eq("message_id", messageId).eq("reactor", user.id).eq(
          "reaction",
          reaction,
        );
      if (error) throw error;
    }
  } else if (assetType === "hashtag") {
    const { data: reactionData, error: reactionDataError } = await supabase
      .from("hashtag_message_reactions").select("message_id").eq(
        "hashtag",
        assetId,
      ).eq("message_id", messageId).eq("reactor", user.id).eq(
        "reaction",
        reaction,
      );
    if (reactionDataError) throw reactionDataError;

    if (reactionData.length === 0) {
      const { error } = await supabase.from("hashtag_message_reactions").insert(
        [
          {
            hashtag: assetId,
            message_id: messageId,
            reactor: user.id,
            reaction,
          },
        ],
      );
      if (error) throw error;
    } else {
      const { error } = await supabase.from("hashtag_message_reactions")
        .delete().eq(
          "hashtag",
          assetId,
        ).eq("message_id", messageId).eq("reactor", user.id).eq(
          "reaction",
          reaction,
        );
      if (error) throw error;
    }
  }
});
