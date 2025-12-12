/**
 * Category Selection Step Component
 * Allows users to select their seller type
 */

import { motion } from "framer-motion";
import { sellerTypes, type SellerType } from "@/lib/sellerTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface CategorySelectionStepProps {
  selectedType: SellerType | null;
  onSelect: (type: SellerType) => void;
  onNext?: () => void;
}

export function CategorySelectionStep({ selectedType, onSelect, onNext }: CategorySelectionStepProps) {
  const typeEntries = Object.entries(sellerTypes) as [SellerType, typeof sellerTypes[SellerType]][];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">What type of seller are you?</h2>
        <p className="text-muted-foreground">
          Select the category that best describes you. This helps us customize your onboarding experience.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {typeEntries.map(([typeId, config]) => {
          const Icon = config.icon;
          const isSelected = selectedType === typeId;

          return (
            <motion.div
              key={typeId}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? "ring-2 ring-primary shadow-lg"
                    : "hover:shadow-md"
                }`}
                onClick={() => onSelect(typeId)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div
                      className={`p-4 rounded-full bg-gradient-to-br ${config.gradient} ${
                        isSelected ? "ring-4 ring-primary ring-offset-2" : ""
                      }`}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{config.name}</h3>
                      <p className="text-sm text-muted-foreground">{config.description}</p>
                    </div>
                    <Badge variant={isSelected ? "default" : "secondary"}>
                      {config.category}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Continue button - only shows when a type is selected */}
      {selectedType && (
        <div className="flex justify-end pt-4">
          <Button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onNext) {
                onNext();
              }
            }} 
            size="lg"
            type="button"
            disabled={!selectedType || !onNext}
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

