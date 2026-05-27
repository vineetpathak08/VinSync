import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in";
const signUpUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "/sign-up";

const toPublicMatcher = (route: string, allowSubpaths: boolean) => {
  if (!route) {
    return null;
  }

  const normalized = route.startsWith("/") ? route : `/${route}`;

  if (!allowSubpaths || normalized === "/") {
    return normalized;
  }

  return normalized.endsWith("(.*)") ? normalized : `${normalized}(.*)`;
};

const publicRoutes = [
  toPublicMatcher("/", false),
  toPublicMatcher(signInUrl, true),
  toPublicMatcher(signUpUrl, true),
].filter((route): route is string => Boolean(route));

const isPublicRoute = createRouteMatcher(publicRoutes);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
