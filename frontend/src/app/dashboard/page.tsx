"use client";
import { useState, useEffect } from "react";
import { Expense, Category, BudgetGoal } from "@/types";
import {
  getExpenses,
  addExpense,
  getCategories,
  addCategory,
  deleteCategory,
  updateExpense,
  updateCategory,
  deleteExpenses,
  updateBillExpense,
  getBudgetGoals,
  updateBudgetGoal,
  deleteBudgetGoal,
} from "@/utils/api";
import * as z from "zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CircleAlert, CircleCheck } from "lucide-react";
import { CategoryManager } from "./_components/CategoryManager";
import { ExpensesDataTable } from "./_components/ExpensesDataTable";
import Overview from "./_components/Overview";
import { useToast } from "@/components/hooks/use-toast";
import { BillUploader } from "./_components/BillUploader";
import { BudgetGoalSetting } from "./_components/BudgetGoalSetting";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number.",
  }),
  categoryId: z.string().min(1, {
    message: "Please select a category.",
  }),
  date: z.date({
    required_error: "Please select a date.",
  }),
});

export default function Dashboard() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([]);

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
    fetchBudgetGoals();
  }, []);

  const fetchExpenses = async () => {
    try {
      const expensesData = await getExpenses();
      setExpenses(expensesData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch expenses.",
        variant: "destructive",
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesData = await getCategories();
      setCategories(categoriesData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch categories.",
        variant: "destructive",
      });
    }
  };

  const fetchBudgetGoals = async () => {
    try {
      const goalsData = await getBudgetGoals();
      setBudgetGoals(goalsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch budget goals.",
        variant: "destructive",
      });
    }
  };

  const handleAddExpense = async (values: z.infer<typeof formSchema>) => {
    await addExpense({
      name: values.name,
      amount: Number(values.amount),
      categoryId: values.categoryId,
      date: values.date,
    })
      .then(() => {
        toast({
          title: "Success",
          description: (
            <div className="flex items-center gap-2">
              <CircleCheck className="h-4 w-4 text-green-500" />
              <span>Your expense has been added successfully.</span>
            </div>
          ),
          variant: "default",
        });
        fetchExpenses();
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: (
            <div className="flex items-center gap-2">
              <CircleAlert className="h-4 w-4 text-white" />
              <span>`An error occurred. Please try again. ${error}`</span>
            </div>
          ),
          variant: "destructive",
        });
      });
    // fetchExpenses();
  };

  const handleAddCategory = async (name: string, color: string) => {
    await addCategory({ name, color })
      .then(() => {
        toast({
          title: "Success",
          description: (
            <div className="flex items-center gap-2">
              <CircleCheck className="h-4 w-4 text-green-500" />
              <span>
                Category <strong>{name}</strong> added successfully.
              </span>
            </div>
          ),
          variant: "default",
        });
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: (
            <div className="flex items-center gap-2">
              <CircleAlert className="h-4 w-4 text-white" />
              <span>An error occurred. Please try again.</span>
            </div>
          ),
          variant: "destructive",
        });
      });

    fetchCategories();
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id)
      .then(() => {
        toast({
          title: "Success",
          description: (
            <div className="flex items-center gap-2">
              <CircleCheck className="h-4 w-4 text-green-500" />
              <span>
                Category and its associated expenses deleted successfully.
              </span>
            </div>
          ),
          variant: "default",
        });
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: (
            <div className="flex items-center gap-2">
              <CircleAlert className="h-4 w-4 text-white" />
              <span>
                An error occurred while deleting category. Please try again.
              </span>
            </div>
          ),
          variant: "destructive",
        });
      });
    fetchCategories();
    fetchExpenses();
  };

  const handleUpdateExpense = async (updatedExpense: Expense) => {
    await updateExpense(updatedExpense)
      .then(() => {
        toast({
          title: "Success",
          description: (
            <div className="flex items-center gap-2">
              <CircleCheck className="h-4 w-4 text-green-500" />
              <span>Your expense has been successfully updated.</span>
            </div>
          ),
          variant: "default",
        });
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: (
            <div className="flex items-center gap-2">
              <CircleAlert className="h-4 w-4 text-white" />
              <span>An error occurred. Please try again.</span>
            </div>
          ),
          variant: "destructive",
        });
      });

    fetchExpenses();
  };

  const handleUpdateCategory = async (updatedCategory: Category) => {
    await updateCategory(updatedCategory)
      .then(() => {
        toast({
          title: "Success",
          description: (
            <div className="flex items-center gap-2">
              <CircleCheck className="h-4 w-4 text-green-500" />
              <span>Category updated successfully.</span>
            </div>
          ),
          variant: "default",
        });
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: (
            <div className="flex items-center gap-2">
              <CircleAlert className="h-4 w-4 text-white" />
              <span>An error occurred. Please try again.</span>
            </div>
          ),
          variant: "destructive",
        });
      });

    fetchCategories();
  };

  const handleDeleteExpenses = async (expenseIds: string[]) => {
    await deleteExpenses(expenseIds)
      .then(() => {
        toast({
          title: "Success",
          description: (
            <div className="flex items-center gap-2">
              <CircleCheck className="h-4 w-4 text-green-500" />
              <span>Expenses deleted successfully.</span>
            </div>
          ),
          variant: "default",
        });
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: (
            <div className="flex items-center gap-2">
              <CircleAlert className="h-4 w-4 text-white" />
              <span>An error occurred. Please try again.</span>
            </div>
          ),
          variant: "destructive",
        });
      });

    fetchExpenses();
  };

  const handleUpdateBillExpense = async (billId: string, expense: Expense) => {
    try {
      await updateBillExpense(billId, expense);
      toast({
        title: "Success",
        description: (
          <div className="flex items-center gap-2">
            <CircleCheck className="h-4 w-4 text-green-500" />
            <span>Bill expense has been updated successfully.</span>
          </div>
        ),
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating bill expense:", error);
      toast({
        title: "Error",
        description: (
          <div className="flex items-center gap-2">
            <CircleAlert className="h-4 w-4 text-white" />
            <span>
              An error occurred while updating the bill expense. Please try
              again.
            </span>
          </div>
        ),
        variant: "destructive",
      });
    }
  };

  console.log("Expenses:", expenses);
  console.log("Categories:", categories);
  console.log("Budget Goals:", budgetGoals);

  return (
    <div>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="manage-expenses">Manage Expenses</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="budget-goals">Budget Goals</TabsTrigger>
          <TabsTrigger value="upload-bill">Bill</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <CardDescription>Overview of your expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <Overview
                expenses={expenses}
                categories={categories}
                budgetGoals={budgetGoals}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage-expenses">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Manage Your Expenses</CardTitle>
              <CardDescription className="text-md">
                Add, edit or delete your expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add row for adding the expenses here */}
              <ExpensesDataTable
                expenses={expenses}
                categories={categories}
                onUpdateExpense={handleUpdateExpense}
                onDeleteExpenses={handleDeleteExpenses}
                onAddExpense={handleAddExpense}
                onAddCategory={handleAddCategory}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Category Management</CardTitle>
              <CardDescription>
                Add, edit, or delete expense categories
                <br />
                <div className="flex items-center mt-1 gap-1">
                  <CircleAlert className="h-4 w-4 text-red-500" />
                  <span className="text-xs text-red-500">
                    Note: Deleting a category will also delete all associated
                    expenses.
                  </span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryManager
                categories={categories}
                onAddCategory={handleAddCategory}
                onDeleteCategory={handleDeleteCategory}
                onUpdateCategory={handleUpdateCategory}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload-bill">
          <Card>
            <CardHeader>
              <CardTitle>Upload and Process Bill</CardTitle>
              <CardDescription>
                Upload a bill image or PDF to automatically generate expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BillUploader
                categories={categories}
                onAddExpense={handleAddExpense}
                onUpdateBillExpense={handleUpdateBillExpense}
                onAddCategory={handleAddCategory}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="budget-goals">
          <Card>
            <CardHeader>
              <CardTitle>Budget Goals</CardTitle>
              <CardDescription>
                Set budget goals for your categories of expenses
              </CardDescription>
            </CardHeader>
            <BudgetGoalSetting
              categories={categories}
              budgetGoals={budgetGoals}
              onBudgetGoalAdded={fetchBudgetGoals}
              onBudgetGoalUpdated={fetchBudgetGoals}
              onBudgetGoalDeleted={fetchBudgetGoals}
              onCategoryAdded={fetchCategories}
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
