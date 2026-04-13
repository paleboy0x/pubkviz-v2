import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function applyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((c) => {
    to.cookies.set(c.name, c.value);
  });
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const publicRoutes = ["/", "/auth/login", "/auth/register", "/auth/callback", "/auth/verify"];
  const isPublicRoute = publicRoutes.some((route) => path === route || path.startsWith(route));

  let profile: { role: string; is_banned: boolean } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role, is_banned")
      .eq("id", user.id)
      .single();
    if (data) {
      profile = { role: data.role, is_banned: data.is_banned };
    }
  }

  if (user && profile?.is_banned) {
    await supabase.auth.signOut();
    if (path.startsWith("/api/")) {
      const res = NextResponse.json({ error: "Račun je blokiran." }, { status: 403 });
      applyCookies(supabaseResponse, res);
      return res;
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("banned", "1");
    const redirectRes = NextResponse.redirect(loginUrl);
    applyCookies(supabaseResponse, redirectRes);
    return redirectRes;
  }

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  if (user && (path === "/auth/login" || path === "/auth/register")) {
    const url = request.nextUrl.clone();
    if (profile?.role === "admin") {
      url.pathname = "/admin";
    } else if (profile?.role === "creator") {
      url.pathname = "/creator";
    } else {
      url.pathname = "/dashboard";
    }
    const redirectRes = NextResponse.redirect(url);
    applyCookies(supabaseResponse, redirectRes);
    return redirectRes;
  }

  if (user && (path.startsWith("/admin") || path.startsWith("/creator"))) {
    if (path.startsWith("/admin") && profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      const redirectRes = NextResponse.redirect(url);
      applyCookies(supabaseResponse, redirectRes);
      return redirectRes;
    }

    if (path.startsWith("/creator") && profile?.role !== "creator" && profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      const redirectRes = NextResponse.redirect(url);
      applyCookies(supabaseResponse, redirectRes);
      return redirectRes;
    }
  }

  return supabaseResponse;
}
