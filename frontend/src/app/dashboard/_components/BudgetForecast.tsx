import React, { useMemo } from "react";
import { BudgetGoal, Expense, Category } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ColoredProgress } from "./ColoredProgress";

interface BudgetForecastProps {
  budgetGoals: BudgetGoal[];
  expenses: Expense[];
  categories: Category[];
}

export const BudgetForecast: React.FC<BudgetForecastProps> = ({
  budgetGoals = [],
  expenses,
  categories,
}) => {
  const [selectedPeriod, setSelectedPeriod] = React.useState<
    "weekly" | "monthly"
  >("weekly");

  const budgetData = useMemo(() => {
    const currentDate = new Date();
    const startOfPeriod = new Date(currentDate);
    if (selectedPeriod === "weekly") {
      startOfPeriod.setDate(currentDate.getDate() - currentDate.getDay());
    } else {
      startOfPeriod.setDate(1);
    }

    return budgetGoals
      .filter((goal) => goal.period === selectedPeriod)
      .map((goal) => {
        const category = categories.find((c) => c._id === goal.categoryId);
        const spent = expenses
          .filter(
            (e) =>
              e.categoryId === goal.categoryId &&
              new Date(e.date) >= startOfPeriod
          )
          .reduce((sum, e) => sum + e.amount, 0);
        const percentage = Math.min((spent / goal.amount) * 100, 100);

        return {
          categoryName: category?.name || "Unknown",
          categoryColor: category?.color || "#000000",
          budget: goal.amount,
          spent,
          remaining: Math.max(goal.amount - spent, 0),
          percentage,
        };
      })
      .sort((a, b) => b.percentage - a.percentage); // Sort by percentage descending
  }, [budgetGoals, expenses, categories, selectedPeriod]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Budget Forecast
          <Select
            value={selectedPeriod}
            onValueChange={(value: "weekly" | "monthly") =>
              setSelectedPeriod(value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {budgetData.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">{item.categoryName}</span>
                <span className="text-sm text-gray-500">
                  ${item.spent.toFixed(2)} / ${item.budget.toFixed(2)}
                </span>
              </div>
              <ColoredProgress
                value={item.percentage}
                className="h-2"
                color={item.categoryColor}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
