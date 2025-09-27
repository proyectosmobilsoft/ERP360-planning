import * as React from "react";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const calculateStrength = (password: string) => {
    let score = 0;
    let requirements = [];
    
    // Longitud mínima
    if (password.length >= 8) {
      score += 1;
      requirements.push("✓ Mínimo 8 caracteres");
    } else {
      requirements.push("✗ Mínimo 8 caracteres");
    }
    
    // Mayúsculas
    if (/[A-Z]/.test(password)) {
      score += 1;
      requirements.push("✓ Al menos una mayúscula");
    } else {
      requirements.push("✗ Al menos una mayúscula");
    }
    
    // Minúsculas
    if (/[a-z]/.test(password)) {
      score += 1;
      requirements.push("✓ Al menos una minúscula");
    } else {
      requirements.push("✗ Al menos una minúscula");
    }
    
    // Números
    if (/\d/.test(password)) {
      score += 1;
      requirements.push("✓ Al menos un número");
    } else {
      requirements.push("✗ Al menos un número");
    }
    
    // Caracteres especiales
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
      requirements.push("✓ Al menos un carácter especial");
    } else {
      requirements.push("✗ Al menos un carácter especial");
    }
    
    return { score, requirements };
  };

  const { score, requirements } = calculateStrength(password);
  
  const getStrengthText = () => {
    if (score === 0) return "Muy débil";
    if (score <= 2) return "Débil";
    if (score <= 3) return "Media";
    if (score <= 4) return "Fuerte";
    return "Muy fuerte";
  };

  const getStrengthColor = () => {
    if (score === 0) return "bg-red-500";
    if (score <= 2) return "bg-red-400";
    if (score <= 3) return "bg-yellow-500";
    if (score <= 4) return "bg-green-500";
    return "bg-green-600";
  };

  const getTextColor = () => {
    if (score === 0) return "text-red-500";
    if (score <= 2) return "text-red-400";
    if (score <= 3) return "text-yellow-600";
    if (score <= 4) return "text-green-600";
    return "text-green-700";
  };

  if (!password) return null;

  return (
    <div className={cn("mt-2 space-y-2", className)}>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              getStrengthColor()
            )}
            style={{ width: `${(score / 5) * 100}%` }}
          />
        </div>
        <span className={cn("text-sm font-medium", getTextColor())}>
          {getStrengthText()}
        </span>
      </div>
      
      {password.length > 0 && (
        <div className="text-xs text-gray-600 space-y-1">
          {requirements.map((req, index) => (
            <div key={index} className={cn(
              req.startsWith("✓") ? "text-green-600" : "text-red-500"
            )}>
              {req}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}