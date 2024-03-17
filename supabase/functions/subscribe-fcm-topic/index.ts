import { serveWithOptions } from "../_shared/cors.ts";
import { subscribeFcmTopic } from "../_shared/fcm.ts";
import supabase, { getSignedUser } from "../_shared/supabase.ts";

serveWithOptions(async (req) => {
  const { fcmToken, topic } = await req.json();
  if (!fcmToken) throw new Error("Unauthorized");
  if (!topic) throw new Error("Topic is required");

  const user = await getSignedUser(req);
  if (!user) throw new Error("Unauthorized");

  const { data: tokenDataSet, error: tokenError } = await supabase
    .from(
      "fcm_tokens",
    ).select("subscribed_topics").eq("user_id", user.id).eq("token", fcmToken);
  if (tokenError) throw tokenError;

  const tokenData = tokenDataSet?.[0];
  if (tokenData) {
    await subscribeFcmTopic(fcmToken, topic);
    const { error: updateError } = await supabase.from("fcm_tokens").update({
      subscribed_topics: [...tokenData.subscribed_topics, topic],
    }).eq("user_id", user.id).eq("token", fcmToken);
    if (updateError) throw updateError;
  }
});
