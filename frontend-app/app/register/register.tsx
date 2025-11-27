import { useState, useEffect } from "react";
import { Link, redirect, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import type { Route } from "./+types/register";

import { API_ROUTES } from "../../config/api";
import { generateKeyPair } from "../helpers/crypto";

import { isAuthenticated } from "../helpers/storage";
import { toast } from "sonner";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ECC Register" },
    { name: "description", content: "Create a new ECChat account" },
  ];
}

export async function loader() {
  if (isAuthenticated()) {
    return redirect('/chat');
  }
}

export default function Register() {
  const navigate = useNavigate();  
  const [registerData, setRegisterData] = useState({ username: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isRegistering, setIsRegistering] = useState(false);
  const [keyPair, setKeyPair] = useState<{ publicKey: string; privateKey: string } | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      const newErrors: { [key: string]: string } = {};

      if (!registerData.username) {
      newErrors.username = "Username is required";
      } else if (registerData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
      }

      if (!registerData.password) {
      newErrors.password = "Password is required";
      } else if (registerData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      }

      if (!registerData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
      } else if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      }

      if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
      }

      setIsRegistering(true);

      try {
      const keys = await generateKeyPair(registerData.password, registerData.username);
      
      if (!keys) {
          throw new Error("Key generation returned null");
      }
      
      const response = await fetch(API_ROUTES.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: registerData.username,
          publicKey: keys.publicKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Server registration failed');
      }

      console.log('Server response:', data);
      
      setKeyPair(keys);

      // setTimeout(() => {
      //     navigate("/login");
      // }, 5000);


      } catch (error) {
      toast.error('Registration failed. Please try again.');
      console.error("Registration error:", error);
      setErrors({ general: error instanceof Error ? "Registration failed. Please try again: " + error.message : "Registration failed. Please try again." });
      setIsRegistering(false);
      }
  };
    
  return (
    <div className="min-h-screen flex items-center justify-center p-4 grid-background">
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <img src="/ecchatlogo.png" alt="ECChat Logo" className="h-20 w-auto glow-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
          <CardDescription className="text-center">Join <span className='font-bold text-red-500 glow-primary'>ECChat</span> and start connecting</CardDescription>
        </CardHeader>
        <CardContent>
          {keyPair ? (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-primary">Registration Successful!</h3>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Public Key:</Label>
                  <div className="p-3 bg-muted rounded-md break-all text-xs font-mono">
                    {keyPair.publicKey}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Private Key:</Label>
                  <div className="p-3 bg-muted rounded-md break-all text-xs font-mono">
                    {keyPair.privateKey}
                  </div>
                </div>
              </div>

              <Link to="/login" className="block">
                <Button className="w-full">Go to Login</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="register-username">Username</Label>
              <Input
                id="register-username"
                autoComplete="off"
                type="text"
                placeholder="Choose a username"
                value={registerData.username}
                onChange={(e) => {
                  setRegisterData({ ...registerData, username: e.target.value });
                  setErrors({ ...errors, username: "" });
                }}
              />
              {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-password">Password</Label>
              <Input
                id="register-password"
                autoComplete="off"
                type="password"
                placeholder="Choose a password"
                value={registerData.password}
                onChange={(e) => {
                  setRegisterData({ ...registerData, password: e.target.value });
                  setErrors({ ...errors, password: "" });
                }}
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-confirm-password">Confirm Password</Label>
              <Input
                id="register-confirm-password"
                autoComplete="off"
                type="password"
                placeholder="Confirm your password"
                value={registerData.confirmPassword}
                onChange={(e) => {
                  setRegisterData({ ...registerData, confirmPassword: e.target.value });
                  setErrors({ ...errors, confirmPassword: "" });
                }}
              />
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
            </div>

            {errors.general && (
              <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
                <p className="text-sm text-destructive">{errors.general}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isRegistering}>
              {isRegistering ? "Generating Keys..." : "Register"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Login here
              </Link>
            </div>
          </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}