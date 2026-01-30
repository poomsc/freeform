import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Missing token parameter" },
      { status: 401 }
    );
  }

  // Create a Supabase client without cookie-based auth
  // (this endpoint uses token-based auth for the Scriptable widget)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    }
  );

  // Look up the user by API token
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("api_token", token)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Get the user's latest board
  const { data: board, error: boardError } = await supabase
    .from("boards")
    .select("snapshot_url")
    .eq("user_id", profile.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (boardError || !board?.snapshot_url) {
    return NextResponse.json(
      { error: "No snapshot available" },
      { status: 404 }
    );
  }

  // Redirect to the snapshot image URL
  return NextResponse.redirect(board.snapshot_url);
}
