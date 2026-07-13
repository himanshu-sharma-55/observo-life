import { Suspense } from "react";
import { InitialLoadingScreen } from "@/components/initial-loading-screen";
import { AppSession } from "./app-session";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<InitialLoadingScreen />}>
      <AppSession>{children}</AppSession>
    </Suspense>
  );
}
