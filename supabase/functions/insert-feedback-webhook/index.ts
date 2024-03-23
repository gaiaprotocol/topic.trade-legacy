import { serveWithOptions } from "../_shared/cors.ts";
import { sendFcmToSpecificUser } from "../_shared/fcm.ts";
import supabase from "../_shared/supabase.ts";

interface Feedback {
  user_id?: string;
  feedback: string;
  created_at: string;
}

interface InsertPayload {
  type: "INSERT";
  table: string;
  schema: string;
  record: Feedback;
  old_record: null;
}

serveWithOptions(async (req) => {
  const u = new URL(req.url);
  const secret = u.searchParams.get("secret");
  if (!secret || secret !== Deno.env.get("INTERNAL_ACCESS_KEY")!) {
    throw new Error("Unauthorized");
  }

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

  const payload: InsertPayload = await req.json();
  for (const t of fcmTokens) {
    try {
      await sendFcmToSpecificUser(t.token, {
        title: "New feedback",
        content: payload.record.feedback,
      });
    } catch (e) {
      console.error(e);
    }
  }
});
