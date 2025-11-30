import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { generateMessage } from "../helpers/create-message";
import { decryptMessage } from "../helpers/crypto";
import { getAuthData } from "../helpers/storage";
import { sharedSecret } from "../helpers/sharedsecret";
import type { Message } from "../Model/Message";
import { toast } from "sonner";

export default function Test() {
  // Client-only auth state to prevent hydration mismatch
  const [authData, setAuthData] = useState<ReturnType<typeof getAuthData> | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  // Encryption section state
  const [plaintext, setPlaintext] = useState("");
  const [receiverUsername, setReceiverUsername] = useState("");
  const [messageOutput, setMessageOutput] = useState<Message | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);

  // Decryption section state
  const [encryptedText, setEncryptedText] = useState("");
  const [senderUsername, setSenderUsername] = useState("");
  const [decryptedText, setDecryptedText] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Initialize auth data and private key on client only
  useEffect(() => {
    setIsClient(true);
    const data = getAuthData();
    setAuthData(data);
    
    if (data?.privateKey) {
      sharedSecret.setMyPrivateKey(data.privateKey);
    }
  }, []);

  const handleEncrypt = async () => {
    if (!plaintext.trim() || !receiverUsername.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!authData?.username || !authData?.privateKey) {
      toast.error("Not authenticated");
      return;
    }

    setIsEncrypting(true);
    try {
      const message = await generateMessage(
        plaintext,
        authData.username,
        receiverUsername,
        `${authData.username}-${receiverUsername}`,
        authData.privateKey
      );
      
      setMessageOutput(message);
      toast.success("Message encrypted successfully!");
    } catch (error) {
      console.error("Encryption error:", error);
      toast.error("Failed to encrypt message");
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleDecrypt = async () => {
    if (!encryptedText.trim() || !senderUsername.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsDecrypting(true);
    try {
      const decrypted = await decryptMessage(encryptedText, senderUsername);
      setDecryptedText(decrypted);
      toast.success("Message decrypted successfully!");
    } catch (error) {
      console.error("Decryption error:", error);
      toast.error("Failed to decrypt message");
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Encryption Test Page</h1>
          <p className="text-muted-foreground">Test message encryption and decryption</p>
          {isClient && authData?.username && (
            <p className="text-sm text-primary mt-2">Logged in as: {authData.username}</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Encryption Section */}
          <Card>
            <CardHeader>
              <CardTitle>Encrypt Message</CardTitle>
              <CardDescription>Generate an encrypted message</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plaintext">Plain Text</Label>
                <Textarea
                  id="plaintext"
                  placeholder="Enter your message..."
                  value={plaintext}
                  onChange={(e) => setPlaintext(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receiver">Receiver's Username</Label>
                <Input
                  id="receiver"
                  placeholder="Enter receiver username..."
                  value={receiverUsername}
                  onChange={(e) => setReceiverUsername(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleEncrypt} 
                disabled={isEncrypting}
                className="w-full"
              >
                {isEncrypting ? "Encrypting..." : "Encrypt Message"}
              </Button>

              {messageOutput && (
                <div className="mt-6 space-y-3 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold text-sm text-primary">Message Output:</h3>
                  
                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="font-medium text-muted-foreground">Sender:</p>
                      <p className="font-mono break-all">{messageOutput.sender}</p>
                    </div>
                    
                    <div>
                      <p className="font-medium text-muted-foreground">Receiver:</p>
                      <p className="font-mono break-all">{messageOutput.receiver}</p>
                    </div>
                    
                    <div>
                      <p className="font-medium text-muted-foreground">Room ID:</p>
                      <p className="font-mono break-all">{messageOutput.room_id}</p>
                    </div>
                    
                    <div>
                      <p className="font-medium text-muted-foreground">Encrypted Message:</p>
                      <p className="font-mono break-all bg-background p-2 rounded">
                        {messageOutput.encrypted_message}
                      </p>
                    </div>
                    
                    <div>
                      <p className="font-medium text-muted-foreground">Message Hash:</p>
                      <p className="font-mono break-all bg-background p-2 rounded">
                        {messageOutput.message_hash}
                      </p>
                    </div>
                    
                    <div>
                      <p className="font-medium text-muted-foreground">Signature:</p>
                      <p className="font-mono break-all bg-background p-2 rounded">
                        {messageOutput.signature}
                      </p>
                    </div>
                    
                    <div>
                      <p className="font-medium text-muted-foreground">Timestamp:</p>
                      <p className="font-mono">{new Date(messageOutput.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Decryption Section */}
          <Card>
            <CardHeader>
              <CardTitle>Decrypt Message</CardTitle>
              <CardDescription>Decrypt an encrypted message</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="encrypted">Encrypted Text</Label>
                <Textarea
                  id="encrypted"
                  placeholder="Enter encrypted message..."
                  value={encryptedText}
                  onChange={(e) => setEncryptedText(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sender">Sender's Username</Label>
                <Input
                  id="sender"
                  placeholder="Enter sender username..."
                  value={senderUsername}
                  onChange={(e) => setSenderUsername(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleDecrypt} 
                disabled={isDecrypting}
                className="w-full"
              >
                {isDecrypting ? "Decrypting..." : "Decrypt Message"}
              </Button>

              {decryptedText && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold text-sm text-primary mb-2">Decrypted Text:</h3>
                  <p className="text-sm bg-background p-3 rounded wrap-break-words">
                    {decryptedText}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Copy Button */}
        {messageOutput && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setEncryptedText(messageOutput.encrypted_message);
                  setSenderUsername(messageOutput.sender);
                  toast.success("Copied to decrypt section");
                }}
              >
                Copy to Decrypt Section
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(messageOutput, null, 2));
                  toast.success("Copied JSON to clipboard");
                }}
              >
                Copy JSON
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
