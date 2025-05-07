import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Header from "@/components/shared/header";
import Footer from "@/components/shared/footer";
import Container from "@/components/shared/container";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { LayoutDashboard, ClipboardList, QrCode } from "lucide-react";

export default async function BusinessOwnerLayout({ children }) {
  const session = await auth();

  // Check if user is authenticated
  if (!session || !session.user) {
    redirect("/login");
  }

  // Check if user is a business owner
  if (session.user.role !== "BUSINESS_OWNER") {
    redirect("/");
  }

  // Check if user account is active
  if (!session.user.isActive) {
    redirect("/login?error=Account+is+inactive");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header session={session} />

      <div className="bg-muted py-4 border-b">
        <Container size="default">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
              <TabsTrigger value="dashboard" asChild>
                <Link href="/dashboard" className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              </TabsTrigger>
              <TabsTrigger value="surveys" asChild>
                <Link href="/surveys" className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  <span className="hidden sm:inline">Surveys</span>
                </Link>
              </TabsTrigger>
              <TabsTrigger value="verify" asChild>
                <Link href="/verify-code" className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  <span className="hidden sm:inline">Verify Code</span>
                </Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </Container>
      </div>

      <main className="flex-1">
        <Container size="default" className="py-8">
          {children}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
