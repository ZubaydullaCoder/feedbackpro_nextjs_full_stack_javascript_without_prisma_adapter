import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session || !session.user.isActive) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <div className="p-6 bg-card rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">
          Welcome, {session.user.name || session.user.email}
        </h2>
        <p>Your account details:</p>
        <ul className="mt-2 space-y-1">
          <li>Email: {session.user.email}</li>
          <li>Role: {session.user.role}</li>
          <li>Status: {session.user.isActive ? "Active" : "Inactive"}</li>
        </ul>
      </div>
    </div>
  );
}
