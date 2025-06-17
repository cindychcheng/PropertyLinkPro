import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MagicAuth() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    // Handle error redirects from backend
    if (error) {
      setStatus("error");
      switch (error) {
        case 'invalid_token':
          setMessage("Invalid authentication link. Please request a new one.");
          break;
        case 'expired_token':
          setMessage("Authentication link has expired. Please request a new one.");
          break;
        case 'account_inactive':
          setMessage("Your account is not active. Please contact an administrator.");
          break;
        case 'authentication_failed':
          setMessage("Authentication failed. Please try again.");
          break;
        default:
          setMessage("Authentication failed. Please try again.");
      }
      return;
    }

    if (!token) {
      setStatus("error");
      setMessage("Invalid authentication link");
      return;
    }

    // If we have a token, the backend should have already processed it
    // Let's verify authentication worked by checking user data
    fetch('/api/auth/user', { credentials: 'include' })
      .then(res => {
        if (res.ok) {
          setStatus("success");
          setMessage("Authentication successful! Redirecting...");
          setTimeout(() => {
            setLocation('/');
          }, 2000);
        } else {
          setStatus("error");
          setMessage("Authentication failed. Please try again.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Authentication failed. Please try again.");
      });
  }, [setLocation]);

  const getIcon = () => {
    switch (status) {
      case "loading":
        return <Loader2 className="h-8 w-8 animate-spin text-blue-600" />;
      case "success":
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case "error":
        return <XCircle className="h-8 w-8 text-red-600" />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case "loading":
        return "Signing you in...";
      case "success":
        return "Welcome!";
      case "error":
        return "Authentication Failed";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center">
            {getIcon()}
          </div>
          <CardTitle className="text-2xl">{getTitle()}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        {status === "error" && (
          <CardContent className="text-center">
            <Button 
              onClick={() => setLocation('/')} 
              variant="outline"
              className="w-full"
            >
              Return to Sign In
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}