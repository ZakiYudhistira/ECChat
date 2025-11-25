import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

export default function Welcome() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-6">
          <div className="flex justify-center">
            <img src="/ecchatlogo.png" alt="ECChat Logo" className="h-32 w-auto" />
          </div>
          <CardTitle className="text-4xl font-bold text-center">Welcome to ECChat</CardTitle>
          <CardDescription className="text-center text-lg">
            Connect, communicate, and collaborate in real-time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Join our community and start chatting with friends, colleagues, and teams.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/login">
              <Button size="lg" className="w-full sm:w-auto px-8">
                Get Started
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
