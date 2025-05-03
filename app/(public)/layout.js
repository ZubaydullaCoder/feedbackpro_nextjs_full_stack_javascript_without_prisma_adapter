import Header from "@/components/shared/header";
import Footer from "@/components/shared/footer";

export default function PublicLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header showAuthButtons={true} />

      <main className="flex-1">{children}</main>

      <Footer />
    </div>
  );
}
