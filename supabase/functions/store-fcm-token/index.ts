import { serveWithOptions } from "../_shared/cors.ts";
import { subscribeFcmTopic } from "../_shared/fcm.ts";
import supabase, { getSignedUser } from "../_shared/supabase.ts";

const TOPICS = ["notices"];

serveWithOptions(async (req) => {
  const { fcmToken } = await req.json();
  if (!fcmToken) throw new Error("Unauthorized");

  const user = await getSignedUser(req);
  if (!user) throw new Error("Unauthorized");

  const { data: tokenDataSet, error: tokenError } = await supabase
    .from(
      "fcm_tokens",
    ).select("user_id").eq("user_id", user.id).eq("token", fcmToken);
  if (tokenError) throw tokenError;

  if (tokenDataSet?.[0] === undefined) {
    for (const topic of TOPICS) {
      await subscribeFcmTopic(fcmToken, topic);
    }
    const { error: insertError } = await supabase.from("fcm_tokens").insert({
      user_id: user.id,
      token: fcmToken,
      subscribed_topics: TOPICS,
    });
    if (insertError) throw insertError;
  }
});
