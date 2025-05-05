import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Header from "@/components/shared/header";
import Footer from "@/components/shared/footer";
import Container from "@/components/shared/container";

export default async function BusinessOwnerLayout({ children }) {
  const session = await auth();

  if (!session || !session.user.isActive) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header session={session} />

      <main className="flex-1">
        <Container size="default" className="py-8">
          {children}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
