/**
 * Payment Step Component
 * Handles payment setup and processing
 */

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type MobileNetwork = "MPESA" | "TIGOPESA" | "AIRTELMONEY" | "HALOPESA";

const mobileNetworks: { id: MobileNetwork; name: string; color: string; description?: string }[] = [
  { id: "MPESA", name: "M-Pesa", color: "bg-green-500", description: "Vodacom" },
  { id: "TIGOPESA", name: "Tigo Pesa", color: "bg-blue-500", description: "Mix By Yas" },
  { id: "AIRTELMONEY", name: "Airtel Money", color: "bg-red-500" },
  { id: "HALOPESA", name: "Halopesa", color: "bg-orange-500" },
];

interface PaymentStepProps {
  data: Record<string, any>;
  onChange: (fieldId: string, value: any) => void;
  onNext?: () => void;
  onBack?: () => void;
  onComplete?: () => void;
  onPaymentInitiate?: () => void;
  paymentStatus?: "pending" | "completed" | "failed" | null;
  isProcessingPayment?: boolean;
  userId?: string;
}

export function PaymentStep({
  data,
  onChange,
  onNext,
  onBack,
  onComplete,
  onPaymentInitiate,
  paymentStatus: parentPaymentStatus,
  isProcessingPayment: parentIsProcessing,
  userId,
}: PaymentStepProps) {
  const { toast } = useToast();
  const isProcessing = parentIsProcessing || false;
  const paymentStatus = parentPaymentStatus || null;

  const pricingModel = data.pricingModel || "subscription";
  const phoneNumber = data.phoneNumber || "";
  const paymentNetwork = data.paymentNetwork || "MPESA";

  // Percentage plans don't require payment
  if (pricingModel === "percentage") {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Payment Setup</h2>
          <p className="text-muted-foreground">
            With the percentage plan, you only pay when you make a sale. No upfront payment required!
          </p>
        </div>

        <div className="bg-muted p-6 rounded-lg">
          <p className="text-sm text-muted-foreground">
            You'll be charged a percentage of each sale. Payment processing will be set up automatically.
          </p>
        </div>

        <div className="flex justify-between pt-4">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          <div className="flex-1" />
          {onComplete && (
            <Button onClick={onComplete} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  const handlePayment = () => {
    if (!phoneNumber) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number for payment",
        variant: "destructive",
      });
      return;
    }

    if (!paymentNetwork) {
      toast({
        title: "Payment method required",
        description: "Please select a mobile money network",
        variant: "destructive",
      });
      return;
    }

    // Trigger parent's payment handler
    if (onPaymentInitiate) {
      onPaymentInitiate();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Payment Setup</h2>
        <p className="text-muted-foreground">
          Enter your phone number and select your mobile money network
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">
            Phone Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phoneNumber"
            type="tel"
            value={phoneNumber}
            onChange={(e) => onChange("phoneNumber", e.target.value)}
            placeholder="+255 XXX XXX XXX"
            required
          />
        </div>

        <div className="space-y-3">
          <Label>
            Mobile Money Network <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={paymentNetwork}
            onValueChange={(value) => onChange("paymentNetwork", value)}
          >
            <div className="grid grid-cols-2 gap-4">
              {mobileNetworks.map((network) => (
                <div key={network.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={network.id} id={network.id} />
                  <Label
                    htmlFor={network.id}
                    className="flex-1 cursor-pointer p-3 border rounded-lg hover:bg-muted"
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${network.color}`} />
                      <div>
                        <div className="font-medium">{network.name}</div>
                        {network.description && (
                          <div className="text-xs text-muted-foreground">
                            {network.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {paymentStatus === "pending" && (
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              Waiting for payment confirmation. Please check your phone and approve the payment.
            </p>
          </div>
        )}

        {paymentStatus === "failed" && (
          <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
            <p className="text-sm text-red-900 dark:text-red-100">
              Payment failed. Please try again.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        {onBack && (
          <Button variant="outline" onClick={onBack} disabled={isProcessing}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
        <div className="flex-1" />
        <Button
          onClick={handlePayment}
          disabled={isProcessing || !phoneNumber || !paymentNetwork}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Process Payment"
          )}
        </Button>
      </div>
    </div>
  );
}

