"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * Component to display a discount code after feedback submission
 * @param {Object} props - Component props
 * @param {string} props.code - The discount code
 * @param {string} props.discountType - The type of discount (PERCENTAGE or FIXED_AMOUNT)
 * @param {number} props.discountValue - The value of the discount
 * @param {Date} props.expiresAt - The expiry date of the discount code
 */
export default function DiscountCodeDisplay({
  code,
  discountType,
  discountValue,
  expiresAt,
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Format the discount value based on type
  const formattedDiscount =
    discountType === "PERCENTAGE"
      ? `${discountValue}%`
      : `$${discountValue.toFixed(2)}`;

  // Format the expiry date
  const formattedExpiryDate = expiresAt
    ? new Date(expiresAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "No expiration";

  // Copy the discount code to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(code).then(
      () => {
        setCopied(true);
        toast({
          title: "Copied!",
          description: "Discount code copied to clipboard",
        });

        // Reset copied state after 2 seconds
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => {
        console.error("Could not copy text: ", err);
        toast({
          title: "Error",
          description: "Failed to copy discount code",
          variant: "destructive",
        });
      }
    );
  };

  return (
    <Card className="w-full border-2 border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Your Discount Code</CardTitle>
        </div>
        <CardDescription>
          Thank you for your feedback! Use this code for your next purchase.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col space-y-1">
            <p className="text-sm text-muted-foreground">Discount Code:</p>
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 px-4 py-2 rounded-md font-mono text-lg font-semibold tracking-wider">
                {code}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                className="h-9 w-9"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Discount:</span>{" "}
              <Badge variant="outline" className="ml-1 font-semibold">
                {formattedDiscount} OFF
              </Badge>
            </div>

            <div>
              <span className="text-muted-foreground">Valid until:</span>{" "}
              <span className="font-medium">{formattedExpiryDate}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-1 text-xs text-muted-foreground">
        <p>Present this code to the business owner when making a purchase.</p>
      </CardFooter>
    </Card>
  );
}
