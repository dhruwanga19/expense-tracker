import React, { useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Expense, Category, BudgetGoal } from "@/types";
import { BudgetForecast } from "./BudgetForecast";
import Carousel, { GraphData } from "./GraphCarousel";

interface OverviewProps {
  expenses: Expense[];
  categories: Category[];
  budgetGoals: BudgetGoal[];
}

const Overview: React.FC<OverviewProps> = ({
  expenses,
  categories,
  budgetGoals,
}) => {
  const totalExpenses = useMemo(
    () => expenses.reduce((total, expense) => total + expense.amount, 0),
    [expenses]
  );

  const getExpensesByMonth = useCallback(() => {
    const monthMap = new Map<string, number>();
    expenses.forEach((expense) => {
      const month = new Date(expense.date).toLocaleString("default", {
        month: "long",
      });
      monthMap.set(month, (monthMap.get(month) || 0) + expense.amount);
    });
    return Array.from(monthMap, ([name, amount]) => ({ name, amount }));
  }, [expenses]);

  const generateForecastData = useCallback(() => {
    const monthlyTotals = expenses.reduce((acc, expense) => {
      const month = new Date(expense.date).toLocaleString("default", {
        month: "short",
      });
      acc[month] = (acc[month] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const currentMonth = new Date().getMonth();

    return months.map((month, index) => {
      const actualAmount = monthlyTotals[month] || 0;
      let forecastAmount;

      if (index <= currentMonth) {
        forecastAmount = actualAmount;
      } else {
        const lastThreeMonths = months
          .slice(Math.max(0, index - 3), index)
          .map((m) => monthlyTotals[m] || 0);
        const avgAmount =
          lastThreeMonths.length > 0
            ? lastThreeMonths.reduce((sum, amount) => sum + amount, 0) /
              lastThreeMonths.length
            : 0;
        forecastAmount = avgAmount * 1.05;
      }

      return {
        name: month,
        actual: Number(actualAmount.toFixed(2)),
        forecast: Number(forecastAmount.toFixed(2)),
      };
    });
  }, [expenses]);

  const getExpensesByCategory = useCallback(() => {
    const categoryMap = new Map<string, { total: number; color: string }>();
    categories.forEach((category) => {
      categoryMap.set(category._id, { total: 0, color: category.color });
    });

    expenses.forEach((expense) => {
      const categoryData = categoryMap.get(expense.categoryId);
      if (categoryData) {
        categoryData.total += expense.amount;
      }
    });

    return Array.from(categoryMap, ([id, { total, color }]) => ({
      id,
      name: categories.find((c) => c._id === id)?.name || "Unknown",
      value: total,
      color,
    }));
  }, [expenses, categories]);

  const loadGraphData = useCallback(
    async (type: GraphData["type"]) => {
      // Simulate API call or data processing
      await new Promise((resolve) => setTimeout(resolve, 500));

      switch (type) {
        case "monthly expense":
          return getExpensesByMonth();
        case "expense forecast":
          return generateForecastData();
        case "categorical expense":
          return getExpensesByCategory();
        default:
          return [];
      }
    },
    [getExpensesByMonth, generateForecastData, getExpensesByCategory]
  );

  const graphs: GraphData[] = useMemo(
    () => [
      { type: "monthly expense" },
      { type: "expense forecast" },
      { type: "categorical expense" },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${totalExpenses.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Number of Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{categories.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Number of Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{expenses.length}</p>
          </CardContent>
        </Card>
      </div>

      <BudgetForecast
        budgetGoals={budgetGoals}
        expenses={expenses}
        categories={categories}
      />

      <Carousel graphs={graphs} loadGraphData={loadGraphData} />
    </div>
  );
};

export default Overview;
