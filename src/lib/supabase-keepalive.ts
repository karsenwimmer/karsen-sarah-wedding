import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export async function keepSupabaseActive() {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("households").select("id").limit(1);

  if (error) {
    throw new Error(error.message);
  }
}
