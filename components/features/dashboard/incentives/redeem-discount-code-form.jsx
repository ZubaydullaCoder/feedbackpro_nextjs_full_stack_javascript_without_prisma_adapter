"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { redeemDiscountCode } from "@/lib/actions/incentives.actions";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Form validation schema
const formSchema = z.object({
  code: z.string().min(1, "Discount code is required"),
});

export default function RedeemDiscountCodeForm({ businessId }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Initialize form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setResult(null);
    
    try {
      const response = await redeemDiscountCode({
        code: data.code.trim(),
        businessId,
      });

      if (response.error) {
        setResult({
          status: "error",
          message: response.error,
        });
        
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
      } else {
        setResult({
          status: "success",
          message: response.message,
          discountCode: response.discountCode,
        });
        
        toast({
          title: "Success",
          description: response.message,
        });
        
        // Reset form
        form.reset();
      }
    } catch (error) {
      console.error("Error redeeming discount code:", error);
      setResult({
        status: "error",
        message: "Failed to redeem discount code. Please try again.",
      });
      
      toast({
        title: "Error",
        description: "Failed to redeem discount code",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format discount value
  const formatDiscountValue = (discountCode) => {
    return discountCode.discountType === "PERCENTAGE"
      ? `${discountCode.discountValue}%`
      : `$${discountCode.discountValue.toFixed(2)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Redeem Discount Code</CardTitle>
        <CardDescription>
          Enter a discount code to mark it as redeemed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter discount code"
                      {...field}
                      className="uppercase"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Redeem Code
            </Button>
          </form>
        </Form>

        {result && (
          <div className="mt-6">
            {result.status === "success" ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Success</AlertTitle>
                <AlertDescription className="text-green-700">
                  <p>{result.message}</p>
                  {result.discountCode && (
                    <div className="mt-2 text-sm">
                      <p>
                        <span className="font-semibold">Code:</span>{" "}
                        <span className="font-mono">{result.discountCode.code}</span>
                      </p>
                      <p>
                        <span className="font-semibold">Discount:</span>{" "}
                        {formatDiscountValue(result.discountCode)}
                      </p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        <p>
          Once redeemed, a discount code cannot be used again.
        </p>
      </CardFooter>
    </Card>
  );
}
