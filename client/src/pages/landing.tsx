import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, TrendingUp, Calendar, Shield, UserCheck, Mail } from "lucide-react";
import { Link } from "wouter";
import { EmailSignin } from "@/components/email-signin";

export default function Landing() {
  const [showEmailSignin, setShowEmailSignin] = useState(false);

  if (showEmailSignin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <EmailSignin onBack={() => setShowEmailSignin(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Building2 className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Property Management System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Streamline your rental property management with comprehensive tracking, 
            automated reminders, and powerful analytics.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
                <CardTitle className="text-gray-900 dark:text-white">Tenant Management</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Track tenant information, lease dates, and contact details with ease.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <CardTitle className="text-gray-900 dark:text-white">Rental Tracking</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Monitor rental rates, increases, and generate automated reminders.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Calendar className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                <CardTitle className="text-gray-900 dark:text-white">Smart Reminders</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Never miss important dates with birthday and rental increase alerts.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Authentication Section */}
        <div className="max-w-md mx-auto">
          <Card className="border-0 shadow-xl bg-white dark:bg-gray-800">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <CardTitle className="text-2xl text-gray-900 dark:text-white">Secure Access</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Sign in to access your property management dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <UserCheck className="h-4 w-4" />
                <span>Role-based access control</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <Shield className="h-4 w-4" />
                <span>Secure authentication system</span>
              </div>
              <div className="space-y-3">
                <Button 
                  onClick={() => {
                    console.log("Microsoft sign-in button clicked");
                    window.location.href = '/api/auth/azure/login';
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Sign In with Microsoft
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
                      or
                    </span>
                  </div>
                </div>
                <Button 
                  onClick={() => window.location.href = '/api/login'}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                  size="lg"
                >
                  Sign In with Replit
                </Button>
                <Button 
                  onClick={() => setShowEmailSignin(true)}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                  size="lg"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Sign In with Email
                </Button>
                <div className="text-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Don't have access yet?</span>
                </div>
                <Link href="/register">
                  <Button 
                    variant="outline" 
                    className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    size="lg"
                  >
                    Request Access
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500 dark:text-gray-400">
          <p>© 2025 Property Management System. Secure and reliable property management.</p>
        </div>
      </div>
    </div>
  );
}