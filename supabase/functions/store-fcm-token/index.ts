import { serveWithOptions } from "../_shared/cors.ts";
import { subscribeFcmTopic } from "../_shared/fcm.ts";
import supabase, { getSignedUser } from "../_shared/supabase.ts";

const TOPICS = ["notices"];

serveWithOptions(async (req) => {
  const { fcmToken } = await req.json();
  if (!fcmToken) throw new Error("Unauthorized");

  const user = await getSignedUser(req);
  if (!user) throw new Error("Unauthorized");

  const { error: upsertError } = await supabase.from("fcm_tokens")
    .upsert({ user_id: user.id, token: fcmToken });
  if (upsertError) throw upsertError;

  const { data: tokenDataSet, error: fetchError } = await supabase.from(
    "fcm_tokens",
  ).select("user_id, token, subscribed_topics").eq("user_id", user.id);
  if (fetchError) throw fetchError;

  const toSubscribeTopics = TOPICS;
  const { data: subscribedTopicsData, error: fetchSubscribedTopicsError } =
    await supabase.from("fcm_subscribed_topics").select("topic").eq(
      "user_id",
      user.id,
    );
  if (fetchSubscribedTopicsError) throw fetchSubscribedTopicsError;
  for (const subscribedTopicData of subscribedTopicsData) {
    if (!toSubscribeTopics.includes(subscribedTopicData.topic)) {
      toSubscribeTopics.push(subscribedTopicData.topic);
    }
  }

  const subscribedTopics: string[] = [];

  for (const tokenData of tokenDataSet) {
    let hasChanged = false;
    for (const topic of toSubscribeTopics) {
      if (!tokenData.subscribed_topics.includes(topic)) {
        try {
          await subscribeFcmTopic(tokenData.token, topic);
        } catch (e) {
          console.error(e);
        }
        if (!subscribedTopics.includes(topic)) subscribedTopics.push(topic);
        tokenData.subscribed_topics.push(topic);
        hasChanged = true;
      }
    }

    if (hasChanged) {
      const { error: updateError } = await supabase.from("fcm_tokens").update({
        subscribed_topics: tokenData.subscribed_topics,
      }).eq("user_id", user.id).eq("token", tokenData.token);
      if (updateError) throw updateError;
    }
  }

  for (const topic of subscribedTopics) {
    const { error } = await supabase.from("fcm_subscribed_topics").upsert({
      user_id: user.id,
      topic,
    });
    if (error) throw error;
  }
});
