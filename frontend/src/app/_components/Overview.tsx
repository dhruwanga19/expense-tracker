import React, { useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  LineChart,
  Line,
  Pie,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Expense, Category, BudgetGoal } from "@/types";
import { BudgetForecast } from "./BudgetForecast";

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
  console.log("Overview - Expenses:", expenses);
  console.log("Overview - Categories:", categories);
  console.log("Overview - Budget Goals:", budgetGoals);
  // Calculate total expenses
  const totalExpenses = useMemo(() => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  }, [expenses]);

  // Get expenses by category
  const expensesByCategory = useMemo(() => {
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

  // Get expenses by month
  const expensesByMonth = useMemo(() => {
    const monthMap = new Map<string, number>();
    expenses.forEach((expense) => {
      const month = new Date(expense.date).toLocaleString("default", {
        month: "long",
      });
      monthMap.set(month, (monthMap.get(month) || 0) + expense.amount);
    });
    return Array.from(monthMap, ([name, amount]) => ({ name, amount }));
  }, [expenses]);

  const generateForecastData = useMemo(() => {
    console.log("Generating forecast data...");
    console.log("Expenses:", expenses);

    const monthlyTotals = expenses.reduce((acc, expense) => {
      const month = new Date(expense.date).toLocaleString("default", {
        month: "short",
      });
      acc[month] = (acc[month] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    console.log("Monthly totals:", monthlyTotals);

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

    const forecastData = months.map((month, index) => {
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

    console.log("Forecast Data:", forecastData);
    return forecastData;
  }, [expenses]);

  useEffect(() => {
    console.log("Component rendered. Forecast data:", generateForecastData);
  }, [generateForecastData]);

  if (expenses.length === 0) {
    return (
      <Card className="w-full h-[400px] flex items-center justify-center">
        <CardContent>
          <p className="text-2xl font-semibold text-gray-500">
            No expenses added
          </p>
        </CardContent>
      </Card>
    );
  }

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Expenses</CardTitle>
            <CardDescription>
              Your expenses over the past months
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expensesByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expenses Forecast</CardTitle>
            <CardDescription>
              Actual vs Forecasted Monthly Expenses
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={generateForecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#8884d8"
                  strokeWidth={3}
                  name="Actual Expenses"
                  dot={{ r: 5 }}
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#82ca9d"
                  strokeWidth={3}
                  name="Forecasted Expenses"
                  dot={{ r: 5 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
            <CardDescription>
              Distribution of your expenses across categories
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expensesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Overview;
