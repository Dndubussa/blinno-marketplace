/**
 * Password Strength Meter Component
 * Displays password validation criteria with real-time feedback
 */

import { Check, X } from "lucide-react";
import { validatePassword, getPasswordStrength, type PasswordCriteria } from "@/lib/passwordValidation";
import { cn } from "@/lib/utils";

interface PasswordStrengthMeterProps {
  password: string;
  showCriteria?: boolean;
  className?: string;
}

export function PasswordStrengthMeter({
  password,
  showCriteria = true,
  className,
}: PasswordStrengthMeterProps) {
  if (!password) {
    return null;
  }

  const validation = validatePassword(password);
  const strength = getPasswordStrength(password);

  const criteriaItems: Array<{
    key: keyof PasswordCriteria;
    label: string;
    met: boolean;
  }> = [
    {
      key: "minLength",
      label: "At least 8 characters",
      met: validation.criteria.minLength,
    },
    {
      key: "hasUppercase",
      label: "At least one uppercase letter (A-Z)",
      met: validation.criteria.hasUppercase,
    },
    {
      key: "hasNumber",
      label: "At least one number (0-9)",
      met: validation.criteria.hasNumber,
    },
    {
      key: "hasSpecialChar",
      label: `At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)`,
      met: validation.criteria.hasSpecialChar,
    },
  ];

  return (
    <div className={cn("space-y-3", className)}>
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-300",
                level <= strength.score
                  ? strength.color
                  : "bg-muted"
              )}
            />
          ))}
        </div>
        {strength.label && (
          <p
            className={cn(
              "text-xs font-medium transition-colors",
              strength.score === 0 && "text-red-500",
              strength.score === 1 && "text-red-600",
              strength.score === 2 && "text-orange-500",
              strength.score === 3 && "text-yellow-600",
              strength.score === 4 && "text-green-600"
            )}
          >
            Password strength: {strength.label}
          </p>
        )}
      </div>

      {/* Criteria List */}
      {showCriteria && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Password requirements:
          </p>
          {criteriaItems.map((item) => (
            <div
              key={item.key}
              className={cn(
                "flex items-center gap-2 text-xs transition-colors",
                item.met ? "text-green-600 dark:text-green-500" : "text-muted-foreground"
              )}
            >
              {item.met ? (
                <Check className="h-3.5 w-3.5 flex-shrink-0" />
              ) : (
                <X className="h-3.5 w-3.5 flex-shrink-0" />
              )}
              <span className={cn(item.met && "font-medium")}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

