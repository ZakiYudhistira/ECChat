import { Link } from "react-router";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { UserPlus, Send, Lock, ChevronDown, ChevronUp } from "lucide-react";

type FeatureType = 'register' | 'send' | 'decrypt' | null;

export default function Welcome() {
  const [activeFeature, setActiveFeature] = useState<FeatureType>(null);

  const toggleFeature = (feature: FeatureType) => {
    setActiveFeature(activeFeature === feature ? null : feature);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center grid-background overflow-hidden">
        
        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-4xl text-center space-y-8 px-4">
          <div className="flex justify-center mb-6">
            <img src="/ecchatlogo.png" alt="ECChat Logo" className="h-40 w-auto glow-primary" />
          </div>
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
            Welcome to <span className="text-primary glow-primary">ECChat</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            End-to-end encrypted messaging powered by Elliptic Curve Cryptography. 
            Your messages stay private, always.
          </p>
          <div className="flex justify-center pt-6">
            <Link to="/login">
              <Button size="lg" className="px-10 py-6 text-lg shadow-lg">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="w-full max-w-4xl mx-auto space-y-4 px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
        
        {/* Feature 1: Create User */}
        <Card className="overflow-hidden">
          <CardHeader 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => toggleFeature('register')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Create User</CardTitle>
                  <CardDescription>Register with end-to-end encryption</CardDescription>
                </div>
              </div>
              {activeFeature === 'register' ? <ChevronUp /> : <ChevronDown />}
            </div>
          </CardHeader>
          {activeFeature === 'register' && (
            <CardContent className="pt-0 pb-6 space-y-3">
              <div className="border-l-2 border-primary pl-4 space-y-2 text-sm">
                <p><span className="font-semibold">1. Enter credentials:</span> Username and password</p>
                <p><span className="font-semibold">2. Key derivation:</span> PBKDF2 (600,000 iterations) generates a seed from your password</p>
                <p><span className="font-semibold">3. Keypair generation:</span> ECC keypair (secp256k1) created from the seed</p>
                <p><span className="font-semibold">4. Store public key:</span> Only your public key is sent to the server</p>
                <p className="text-muted-foreground italic">🔒 Your private key never leaves your device</p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Feature 2: Send Message */}
        <Card className="overflow-hidden">
          <CardHeader 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => toggleFeature('send')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Send className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Send Message</CardTitle>
                  <CardDescription>Encrypt and transmit securely</CardDescription>
                </div>
              </div>
              {activeFeature === 'send' ? <ChevronUp /> : <ChevronDown />}
            </div>
          </CardHeader>
          {activeFeature === 'send' && (
            <CardContent className="pt-0 pb-6 space-y-3">
              <div className="border-l-2 border-primary pl-4 space-y-2 text-sm">
                <p><span className="font-semibold">1. Key exchange:</span> ECDH derives shared secret from your private key + recipient's public key</p>
                <p><span className="font-semibold">2. Encryption:</span> AES-GCM-256 encrypts your message using the shared secret</p>
                <p><span className="font-semibold">3. Hash generation:</span> SHA3-256 creates a hash of the message for integrity</p>
                <p><span className="font-semibold">4. Digital signature:</span> ECDSA signs the message with your private key</p>
                <p><span className="font-semibold">5. Transmission:</span> Encrypted message + signature sent via WebSocket</p>
                <p className="text-muted-foreground italic">🔒 Server only sees encrypted data</p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Feature 3: Decrypt Message */}
        <Card className="overflow-hidden">
          <CardHeader 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => toggleFeature('decrypt')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Decrypt Message</CardTitle>
                  <CardDescription>Verify and decrypt received messages</CardDescription>
                </div>
              </div>
              {activeFeature === 'decrypt' ? <ChevronUp /> : <ChevronDown />}
            </div>
          </CardHeader>
          {activeFeature === 'decrypt' && (
            <CardContent className="pt-0 pb-6 space-y-3">
              <div className="border-l-2 border-primary pl-4 space-y-2 text-sm">
                <p><span className="font-semibold">1. Receive message:</span> Encrypted message arrives via WebSocket</p>
                <p><span className="font-semibold">2. Verify signature:</span> ECDSA verifies message authenticity using sender's public key</p>
                <p><span className="font-semibold">3. Key derivation:</span> ECDH derives same shared secret from your private key + sender's public key</p>
                <p><span className="font-semibold">4. Decryption:</span> AES-GCM-256 decrypts the message using the shared secret</p>
                <p><span className="font-semibold">5. Hash verification:</span> SHA3-256 verifies message integrity hasn't been compromised</p>
                <p className="text-muted-foreground italic">🔒 Only you can decrypt messages sent to you</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Footer */}
      <div className="py-12 text-center text-sm text-muted-foreground bg-muted/20">
        <p>Built with React, Express.js, and MongoDB</p>
        <p className="mt-1">Secured by Elliptic Curve Cryptography</p>
      </div>
    </div>
  );
}
