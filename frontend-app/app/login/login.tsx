import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import type { Route } from "./+types/login";
import { API_ROUTES } from "config/api";

import {generateKeyPair, signMessage} from "../helpers/crypto";
import { storeAuthData, isAuthenticated } from "../helpers/storage";

import { useNavigate } from "react-router";
import { Toaster, toast } from 'sonner';


export function meta({}: Route.MetaArgs) {
  return [
    { title: "ECC Login" },
    { name: "description", content: "Login to your ECChat account" },
  ];
}

export default function Login() {
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [nonce, setNonce] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [keyPair, setKeyPair] = useState<{ publicKey: string; privateKey: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!loginData.username) newErrors.username = "Username is required";
    if (!loginData.password) newErrors.password = "Password is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    // Key Generation
    try {
      const pair = await generateKeyPair(loginData.password, loginData.username);
      setKeyPair(pair);
      
      // Nonce request
      const response = await fetch(API_ROUTES.LOGIN, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to get login challenge');
      }

      setNonce(data.nonce);
      console.log("Login nonce received:", data.nonce);

      // Nonce signing
      const signature = await signMessage(data.nonce, pair.privateKey);
      
      const challengeResponse = await fetch(API_ROUTES.CHALLENGE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: loginData.username,
          nonce: data.nonce,
          signature
        })
      });
      
      // JWT retrieval
      const challengeData = await challengeResponse.json();
      
      // Handle login processes
      if (challengeResponse.ok && challengeData.success) {
        storeAuthData(
          loginData.username,
          pair.publicKey,
          pair.privateKey,
          challengeData.token // JWT from server
        );
        
        console.log('Login successful!');
        
        toast.success('Login successful!');
        navigate("/chat");
        setKeyPair(null);
      } else {
        throw new Error(challengeData.message || 'Challenge verification failed');
      }

      setErrors({});
    } catch (error) {
      console.error("Login error:", error);
      setErrors({ general: error instanceof Error ? error.message : "Login failed. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 grid-background">
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <img src="/ecchatlogo.png" alt="ECChat Logo" className="h-20 w-auto glow-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">Login to your <span className='font-bold text-red-500 glow-primary'>ECChat</span> account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-username">Username</Label>
              <Input
                id="login-username"
                type="text"
                placeholder="Enter your username"
                autoComplete="off"
                value={loginData.username}
                onChange={(e) => {
                  setLoginData({ ...loginData, username: e.target.value });
                  setErrors({ ...errors, username: "" });
                }}
              />
              {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                autoComplete="off"
                value={loginData.password}
                onChange={(e) => {
                  setLoginData({ ...loginData, password: e.target.value });
                  setErrors({ ...errors, password: "" });
                }}
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            {nonce && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Processing Challenge:</Label>
                <div className="p-3 bg-muted rounded-md break-all text-xs font-mono">
                  {nonce}
                </div>
              </div>
            )}

            {errors.general && (
              <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
                <p className="text-sm text-destructive">{errors.general}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading 
                ? (nonce ? "Logging In" : "Authenticating...") 
                : "Login"
              }
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline">
                Register here
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}