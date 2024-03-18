import { serveWithOptions } from "../_shared/cors.ts";
import { unsubscribeFcmTopic } from "../_shared/fcm.ts";
import supabase, { getSignedUser } from "../_shared/supabase.ts";

serveWithOptions(async (req) => {
  const { topic } = await req.json();
  if (!topic) throw new Error("Topic is required");

  const user = await getSignedUser(req);
  if (!user) throw new Error("Unauthorized");

  const { data: tokenDataSet, error: fetchError } = await supabase.from(
    "fcm_tokens",
  ).select("user_id, token, subscribed_topics").eq("user_id", user.id);
  if (fetchError) throw fetchError;

  const unsubscribedTopics: string[] = [];
  for (const tokenData of tokenDataSet) {
    let hasChanged = false;
    if (tokenData.subscribed_topics.includes(topic)) {
      try {
        await unsubscribeFcmTopic(tokenData.token, topic);
      } catch (e) {
        console.error(e);
      }
      if (!unsubscribedTopics.includes(topic)) unsubscribedTopics.push(topic);
      tokenData.subscribed_topics = tokenData.subscribed_topics.filter((
        t: string,
      ) => t !== topic);
      hasChanged = true;
    }

    if (hasChanged) {
      const { error: updateError } = await supabase.from("fcm_tokens").update({
        subscribed_topics: tokenData.subscribed_topics,
      }).eq("user_id", user.id).eq("token", tokenData.token);
      if (updateError) throw updateError;
    }
  }

  for (const topic of unsubscribedTopics) {
    const { error } = await supabase.from("fcm_subscribed_topics").delete().eq(
      "user_id",
      user.id,
    ).eq("topic", topic);
    if (error) throw error;
  }
});
