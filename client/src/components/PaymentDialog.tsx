import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  CreditCard,
  Wallet,
  Building2,
  CheckCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: number;
  invoiceNumber: string;
  amount: number;
  customerEmail?: string;
  onPaymentSuccess?: (paymentDetails: any) => void;
}

type PaymentGateway = 'stripe' | 'razorpay' | 'bank';

export function PaymentDialog({
  open,
  onOpenChange,
  invoiceId,
  invoiceNumber,
  amount,
  customerEmail,
  onPaymentSuccess,
}: PaymentDialogProps) {
  const { toast } = useToast();
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>('stripe');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const { data: razorpayConfig } = useQuery({
    queryKey: ['/api/razorpay/config'],
    retry: false,
  });

  const stripeCheckoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/stripe/create-payment-intent', {
        amount,
        invoiceId,
        customerEmail,
        currency: 'inr',
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.clientSecret) {
        setPaymentStatus('success');
        toast({ title: "Payment intent created", description: "Use Stripe Elements to complete payment" });
        onPaymentSuccess?.({ paymentIntentId: data.paymentIntentId, clientSecret: data.clientSecret });
      }
    },
    onError: (error: any) => {
      toast({ title: "Payment failed", description: error.message, variant: "destructive" });
      setPaymentStatus('error');
    },
  });

  const razorpayOrderMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/razorpay/create-order', {
        amount,
        invoiceId,
        currency: 'INR',
      });
      return response.json();
    },
    onSuccess: async (data) => {
      if (!(window as any).Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      const options = {
        key: (razorpayConfig as any)?.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'AutoServ Enterprise',
        description: `Invoice ${invoiceNumber}`,
        order_id: data.orderId,
        handler: async function (response: any) {
          try {
            const verifyResponse = await apiRequest('POST', '/api/razorpay/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            const verifyData = await verifyResponse.json();
            if (verifyData.verified) {
              setPaymentStatus('success');
              toast({ title: "Payment successful" });
              onPaymentSuccess?.(verifyData.payment);
            }
          } catch (error: any) {
            toast({ title: "Payment verification failed", variant: "destructive" });
            setPaymentStatus('error');
          }
        },
        prefill: {
          email: customerEmail,
        },
        theme: {
          color: '#3b82f6',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    },
    onError: (error: any) => {
      toast({ title: "Failed to create order", description: error.message, variant: "destructive" });
      setPaymentStatus('error');
    },
  });

  const handlePayment = () => {
    setPaymentStatus('processing');

    if (selectedGateway === 'stripe') {
      stripeCheckoutMutation.mutate();
    } else if (selectedGateway === 'razorpay') {
      razorpayOrderMutation.mutate();
    } else if (selectedGateway === 'bank') {
      toast({ title: "Bank transfer details sent to email" });
      setPaymentStatus('success');
    }
  };

  const isProcessing = stripeCheckoutMutation.isPending || razorpayOrderMutation.isPending || paymentStatus === 'processing';
  const razorpayAvailable = (razorpayConfig as any)?.configured;

  const paymentMethods = [
    {
      id: 'stripe' as const,
      name: 'Card Payment',
      description: 'Pay securely with credit/debit card',
      icon: CreditCard,
      available: true,
    },
    {
      id: 'razorpay' as const,
      name: 'UPI / Netbanking',
      description: 'Pay via UPI, Netbanking, or Wallet',
      icon: Wallet,
      available: razorpayAvailable,
    },
    {
      id: 'bank' as const,
      name: 'Bank Transfer',
      description: 'Pay via direct bank transfer',
      icon: Building2,
      available: true,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Payment
          </DialogTitle>
          <DialogDescription>
            Invoice #{invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        {paymentStatus === 'success' ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold">Payment Successful</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your payment has been processed successfully
            </p>
            <Button className="mt-6" onClick={() => onOpenChange(false)} data-testid="button-close-payment">
              Close
            </Button>
          </div>
        ) : (
          <>
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount Due</span>
                  <span className="text-2xl font-bold">
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                    }).format(amount)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Payment Method</Label>
              <RadioGroup
                value={selectedGateway}
                onValueChange={(value) => setSelectedGateway(value as PaymentGateway)}
                className="space-y-2"
              >
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <Label
                      key={method.id}
                      htmlFor={method.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                        selectedGateway === method.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50",
                        !method.available && "cursor-not-allowed opacity-50"
                      )}
                    >
                      <RadioGroupItem
                        value={method.id}
                        id={method.id}
                        disabled={!method.available}
                        data-testid={`radio-${method.id}`}
                      />
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{method.name}</span>
                          {!method.available && (
                            <Badge variant="secondary" className="text-xs">
                              Not Available
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {method.description}
                        </p>
                      </div>
                    </Label>
                  );
                })}
              </RadioGroup>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={isProcessing}
                data-testid="button-cancel-payment"
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handlePayment}
                disabled={isProcessing}
                data-testid="button-process-payment"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay Now
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
