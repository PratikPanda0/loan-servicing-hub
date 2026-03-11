import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { FileQuestion, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center px-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary mx-auto mb-6">
            <FileQuestion className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="mb-2 text-6xl font-bold text-foreground">404</h1>
          <p className="mb-6 text-xl text-muted-foreground">
            Oops! The page you're looking for doesn't exist.
          </p>
          <Link to="/">
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
