import { useState } from "react";
import { useNavigate } from "react-router";
import { Sprout, Phone, ArrowRight, Cpu } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../components/ui/input-otp";

export default function LoginScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length === 10) {
      setStep("otp");
    }
  };

  const handleOtpComplete = (value: string) => {
    setOtp(value);
    if (value.length === 6) {
      // Simulate OTP verification
      setTimeout(() => {
        navigate("/select-role");
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary to-primary/90 pt-12 pb-16 px-6 rounded-b-[2rem]">
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <Sprout className="w-10 h-10 text-primary" strokeWidth={2.5} />
            </div>
            <div className="absolute -top-1 -right-1 bg-accent rounded-full p-1.5">
              <Cpu className="w-4 h-4 text-secondary" strokeWidth={2.5} />
            </div>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-white mb-1">
          Smart Krishi
        </h1>
        <p className="text-center text-white/90">स्मार्ट कृषि</p>
      </div>

      {/* Form Content */}
      <div className="flex-1 px-6 -mt-8">
        <div className="bg-card rounded-2xl shadow-lg p-6 mb-6">
          {step === "phone" ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2 text-center">
                  Welcome Back! | स्वागत है!
                </h2>
                <p className="text-muted-foreground text-center text-sm">
                  Enter your phone number to continue
                </p>
                <p className="text-muted-foreground text-center text-sm">
                  जारी रखने के लिए अपना फ़ोन नंबर दर्ज करें
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">
                    Phone Number | फ़ोन नंबर
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="Enter 10-digit mobile number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="pl-12 h-14 text-lg"
                      maxLength={10}
                      inputMode="numeric"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 text-lg gap-2"
                  disabled={phoneNumber.length !== 10}
                >
                  Send OTP | OTP भेजें
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2 text-center">
                  Verify OTP | OTP सत्यापित करें
                </h2>
                <p className="text-muted-foreground text-center text-sm">
                  Enter the 6-digit code sent to
                </p>
                <p className="text-primary text-center font-medium">
                  +91 {phoneNumber}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={handleOtpComplete}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="w-12 h-14 text-xl" />
                      <InputOTPSlot index={1} className="w-12 h-14 text-xl" />
                      <InputOTPSlot index={2} className="w-12 h-14 text-xl" />
                      <InputOTPSlot index={3} className="w-12 h-14 text-xl" />
                      <InputOTPSlot index={4} className="w-12 h-14 text-xl" />
                      <InputOTPSlot index={5} className="w-12 h-14 text-xl" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <div className="text-center">
                  <button
                    className="text-sm text-primary hover:underline"
                    onClick={() => setStep("phone")}
                  >
                    Change Number | नंबर बदलें
                  </button>
                </div>
                
                <div className="text-center">
                  <button className="text-sm text-muted-foreground hover:text-foreground">
                    Resend OTP | पुनः OTP भेजें
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Footer */}
        <div className="text-center text-xs text-muted-foreground space-y-1 mb-6">
          <p>By continuing, you agree to our Terms & Privacy Policy</p>
          <p>जारी रखने से, आप हमारी शर्तों और गोपनीयता नीति से सहमत हैं</p>
        </div>
      </div>
    </div>
  );
}
