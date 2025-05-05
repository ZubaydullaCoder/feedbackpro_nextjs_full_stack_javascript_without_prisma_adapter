import { auth } from "@/auth";
import Header from "@/components/shared/header";
import Footer from "@/components/shared/footer";

export default async function PublicLayout({ children }) {
  const session = await auth();

  return (
    <div className="flex flex-col min-h-screen">
      <Header session={session} />

      <main className="flex-1">{children}</main>

      <Footer />
    </div>
  );
}
