import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Header from "@/components/shared/header";
import Footer from "@/components/shared/footer";
import Container from "@/components/shared/container";

export default async function AuthLayout({ children }) {
  const session = await auth();

  // If user is authenticated, redirect to dashboard
  // This provides a second layer of protection if middleware fails
  if (session?.user?.isActive) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header session={session} />

      <main className="flex-1 flex items-center justify-center py-12">
        <Container size="default" className="max-w-md w-full">
          {children}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
