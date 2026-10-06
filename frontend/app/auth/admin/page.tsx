import { redirect } from "next/navigation";

export default function AuthAdminRedirect() {
  redirect("/auth/adminlogin");
}
