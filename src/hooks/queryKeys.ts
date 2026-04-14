export const queryKeys = {
  auth: {
    user: () => ["auth", "user"] as const,
  },
  patients: {
    me: ["patients", "me"] as const,
    home: (email?: string | null) => ["patients", "home", email ?? "anonymous"] as const,
  },
};
