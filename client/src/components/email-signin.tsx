import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, ArrowLeft } from "lucide-react";

interface EmailSigninProps {
  onBack: () => void;
}

export function EmailSignin({ onBack }: EmailSigninProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await apiRequest("POST", "/api/auth/magic-link", { email: email.trim() });
      setIsSubmitted(true);
      toast({
        title: "Magic link sent",
        description: "Check your email for a sign-in link",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send magic link",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We've sent a sign-in link to {email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Click the link in your email to sign in. The link will expire in 1 hour.
          </p>
          <Button variant="outline" onClick={onBack} className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to sign in options
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign in with email</CardTitle>
        <CardDescription>
          Enter your email address and we'll send you a secure sign-in link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-1"
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Sending..." : "Send magic link"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}