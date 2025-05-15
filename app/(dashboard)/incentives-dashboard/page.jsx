import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Container from "@/components/shared/container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DiscountCodeManagementTable from "@/components/features/dashboard/incentives/discount-code-management-table";
import RedeemDiscountCodeForm from "@/components/features/dashboard/incentives/redeem-discount-code-form";

export const metadata = {
  title: "Incentives | FeedbackPro",
  description: "Manage discount codes and incentives for your customers",
};

export default async function IncentivesPage() {
  const session = await auth();
  
  // Check if user is authenticated and is a business owner
  if (!session || !session.user || session.user.role !== "BUSINESS_OWNER") {
    notFound();
  }
  
  // Find the business for this user
  const business = await prisma.business.findUnique({
    where: { userId: session.user.id },
    select: { id: true, name: true },
  });
  
  if (!business) {
    notFound();
  }

  return (
    <Container size="default">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incentives</h1>
          <p className="text-muted-foreground mt-2">
            Manage discount codes and incentives for your customers
          </p>
        </div>
        
        <Tabs defaultValue="codes" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-2 md:inline-flex">
            <TabsTrigger value="codes">Discount Codes</TabsTrigger>
            <TabsTrigger value="redeem">Redeem Code</TabsTrigger>
          </TabsList>
          
          <TabsContent value="codes" className="space-y-6 mt-6">
            <DiscountCodeManagementTable businessId={business.id} />
          </TabsContent>
          
          <TabsContent value="redeem" className="space-y-6 mt-6">
            <RedeemDiscountCodeForm businessId={business.id} />
          </TabsContent>
        </Tabs>
      </div>
    </Container>
  );
}
