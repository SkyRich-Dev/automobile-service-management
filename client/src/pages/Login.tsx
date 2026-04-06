import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/lib/settings-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Car, Loader2, AlertCircle } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { loginAsync, isLoggingIn, loginError } = useAuth();
  const { getSetting } = useSettings();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginAsync({ username: formData.username, password: formData.password });
      setLocation("/");
    } catch (err) {
      // Error handled by hook
    }
  };

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center bg-background gradient-mesh p-4"
      data-testid="page-login"
    >
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-xl shadow-primary/25">
            <Car className="h-8 w-8 text-white" />
          </div>
          <h1 className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            {getSetting('company_short_name', 'AutoServ')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('auth.tagline', getSetting('company_tagline', 'Enterprise Automotive Management'))}
          </p>
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardHeader className="pb-4 text-center">
            <CardTitle>{t('auth.welcomeBack', 'Welcome Back')}</CardTitle>
            <CardDescription>{t('auth.signInToContinue', 'Sign in to your account to continue')}</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{loginError.message}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">{t('auth.username', 'Username')}</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder={t('auth.enterUsername', 'Enter your username')}
                  required
                  autoComplete="username"
                  data-testid="input-username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password', 'Password')}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t('auth.enterPassword', 'Enter your password')}
                  required
                  autoComplete="current-password"
                  data-testid="input-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoggingIn}
                data-testid="button-login"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('auth.signingIn', 'Signing in...')}
                  </>
                ) : (
                  t('auth.signIn', 'Sign In')
                )}
              </Button>

              <div className="text-center">
                <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-primary hover:underline" data-testid="link-forgot-password">
                  Forgot password?
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {getSetting('footer_text', '2026 AutoServ Enterprise. All rights reserved.')}
        </p>
      </div>
    </div>
  );
}
