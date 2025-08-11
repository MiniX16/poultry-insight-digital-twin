
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-farm-blue mb-6">404</h1>
        <p className="text-2xl text-gray-700 mb-6">Página no encontrada</p>
        <p className="text-gray-500 mb-8">
          La página que busca no existe o ha sido trasladada.
        </p>
        <Button asChild>
          <Link to="/">
            Volver al Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
