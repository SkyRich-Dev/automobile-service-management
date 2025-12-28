import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench } from "lucide-react";

export default function Login() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50/50">
      <div className="w-full max-w-md px-4">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/30">
            <Wrench className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>
        
        <Card className="border-none shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              AutoServ
            </CardTitle>
            <CardDescription className="text-base">
              Enterprise Automotive Management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-secondary/50 rounded-lg text-sm text-center text-muted-foreground">
              Sign in to access your dashboard, manage job cards, and track inventory.
            </div>
            
            <Button 
              className="w-full py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
              onClick={handleLogin}
            >
              Log In with Replit
            </Button>
          </CardContent>
        </Card>
        
        <p className="text-center text-xs text-muted-foreground mt-8">
          © 2024 AutoServ Enterprise. All rights reserved.
        </p>
      </div>
    </div>
  );
}
