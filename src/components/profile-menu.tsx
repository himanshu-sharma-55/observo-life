"use client";

import { useState } from "react";
import { ChevronsUpDown, LogOut } from "lucide-react";
import { useSessionUser } from "@/components/session-user-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { logoutUser } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

function getInitials(name: string | null, email: string | null) {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  if (email) return email[0]?.toUpperCase() ?? "?";
  return "?";
}

export function ProfileMenu({ variant = "full" }: { variant?: "full" | "compact" }) {
  const user = useSessionUser();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const name = user?.name?.trim() || "Your account";
  const email = user?.email ?? "";
  const initials = getInitials(user?.name ?? null, user?.email ?? null);

  const avatar = (
    <Avatar size={variant === "compact" ? "sm" : "default"}>
      {user?.image ? <AvatarImage src={user.image} alt={name} /> : null}
      <AvatarFallback className="bg-primary/10 font-medium text-primary">
        {initials}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex items-center gap-3 rounded-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/45",
            variant === "full"
              ? "w-full p-2 text-left hover:bg-muted/70"
              : "rounded-full",
          )}
          aria-label="Open profile menu"
        >
          {avatar}
          {variant === "full" && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">
                  {name}
                </span>
                {email && (
                  <span className="block truncate text-xs text-muted-foreground">{email}</span>
                )}
              </span>
              <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
            </>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          side={variant === "full" ? "top" : "bottom"}
          sideOffset={8}
          className="w-60"
        >
          <div className="flex items-center gap-3 px-2 py-2">
            {avatar}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{name}</p>
              {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ll be signed out of Observolife and need to log in again to reach your
              events and observations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              render={
                <Button variant="outline" className="sm:w-auto">
                  Cancel
                </Button>
              }
            />
            <form action={logoutUser} className="contents">
              <Button type="submit" variant="destructive" className="gap-2 sm:w-auto">
                <LogOut className="size-4" />
                Sign out
              </Button>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
