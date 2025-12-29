import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, ArrowLeft, Receipt } from "lucide-react";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get("session_id");
  const invoiceId = searchParams.get("invoice");

  const { data: paymentStatus, isLoading } = useQuery({
    queryKey: ['/api/stripe/payment-status', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const res = await fetch(`/api/stripe/payment-status/${sessionId}`);
      return res.json();
    },
    enabled: !!sessionId,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Verifying payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center py-12">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          </div>
          
          <h1 className="text-2xl font-bold" data-testid="text-payment-success">
            Payment Successful
          </h1>
          
          <p className="mt-2 text-center text-muted-foreground">
            Thank you for your payment. Your transaction has been completed successfully.
          </p>

          {paymentStatus && (
            <div className="mt-6 w-full rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: paymentStatus.currency?.toUpperCase() || 'INR',
                  }).format((paymentStatus.amountTotal || 0) / 100)}
                </span>
              </div>
              {paymentStatus.customerEmail && (
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Receipt sent to</span>
                  <span className="font-medium">{paymentStatus.customerEmail}</span>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 flex w-full gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setLocation("/")}
              data-testid="button-go-dashboard"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button
              className="flex-1"
              onClick={() => setLocation("/service")}
              data-testid="button-view-services"
            >
              <Receipt className="mr-2 h-4 w-4" />
              View Services
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
