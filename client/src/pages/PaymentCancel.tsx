import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function PaymentCancel() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const invoiceId = searchParams.get("invoice");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center py-12">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-10 w-10 text-destructive" />
          </div>
          
          <h1 className="text-2xl font-bold" data-testid="text-payment-cancelled">
            Payment Cancelled
          </h1>
          
          <p className="mt-2 text-center text-muted-foreground">
            Your payment was cancelled. No charges have been made to your account.
          </p>

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
              data-testid="button-try-again"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
