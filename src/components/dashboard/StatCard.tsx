
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  color?: string;
}

const StatCard = ({ title, value, icon, trend, className, color = "text-farm-blue" }: StatCardProps) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className={`mt-2 text-2xl font-bold ${color}`}>{value}</h3>
            
            {trend && (
              <div className="mt-1 flex items-center text-xs">
                {trend.isPositive ? (
                  <span className="text-green-500">↑ {Math.abs(trend.value)}%</span>
                ) : (
                  <span className="text-red-500">↓ {Math.abs(trend.value)}%</span>
                )}
                <span className="ml-1 text-muted-foreground">vs. ayer</span>
              </div>
            )}
          </div>
          
          <div className={`${color} p-2 rounded-md bg-muted`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
