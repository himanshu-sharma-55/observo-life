"use client";

import { createContext, useContext } from "react";

export type SessionUser = {
  name: string | null;
  email: string | null;
  image: string | null;
} | null;

const SessionUserContext = createContext<SessionUser>(null);

export function SessionUserProvider({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return (
    <SessionUserContext.Provider value={user}>{children}</SessionUserContext.Provider>
  );
}

export function useSessionUser() {
  return useContext(SessionUserContext);
}
