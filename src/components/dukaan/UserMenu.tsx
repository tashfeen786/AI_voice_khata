import { useNavigate } from "react-router-dom";
import { LogOut, UserRound } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

export function UserMenu() {
  const { profile, currentUser, logout } = useAuth();
  const nav = useNavigate();

  const name = profile ? `${profile.name} ${profile.surname}`.trim() : currentUser?.name ?? "User";
  const initials = `${profile?.name?.[0] ?? currentUser?.name?.[0] ?? "U"}${profile?.surname?.[0] ?? currentUser?.family_name?.[0] ?? ""}`.toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none rounded-full ring-2 ring-primary/20 focus:ring-primary/50 transition">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary text-primary-foreground font-semibold">{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl">
        <DropdownMenuLabel className="font-normal">
          <div className="font-medium text-foreground">{name}</div>
          <div className="text-xs text-muted-foreground truncate">{profile?.email ?? currentUser?.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => nav("/account/profile")} className="cursor-pointer">
          <UserRound className="h-4 w-4 mr-2" /> My Account
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => { await logout(); nav("/login", { replace: true }); }}
          className="cursor-pointer text-danger focus:text-danger">
          <LogOut className="h-4 w-4 mr-2" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}