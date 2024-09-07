"use client";
import { useState, useEffect } from "react";
import { Expense, Category } from "@/types";
import {
  getExpenses,
  addExpense,
  getCategories,
  addCategory,
  deleteCategory,
  updateExpense,
  updateCategory,
  deleteExpenses,
} from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CategoryManager } from "./_components/CategoryManager";
import { ExpensesDataTable } from "./_components/ExpensesDataTable";
import Overview from "./_components/Overview";

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

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      amount: "",
      categoryId: "",
      date: new Date(),
    },
  });

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  const fetchExpenses = async () => {
    const expensesData = await getExpenses();
    setExpenses(expensesData);
  };

  const fetchCategories = async () => {
    const categoriesData = await getCategories();
    setCategories(categoriesData);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await addExpense({
      name: values.name,
      amount: Number(values.amount),
      categoryId: values.categoryId,
      date: values.date,
    });
    form.reset();
    fetchExpenses();
  };

  const handleAddCategory = async (name: string, color: string) => {
    await addCategory({ name, color });
    fetchCategories();
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id);
    fetchCategories();
  };

  const handleUpdateExpense = async (updatedExpense: Expense) => {
    await updateExpense(updatedExpense);
    fetchExpenses();
  };

  const handleUpdateCategory = async (updatedCategory: Category) => {
    await updateCategory(updatedCategory);
    fetchCategories();
  };

  const handleDeleteExpenses = async (expenseIds: string[]) => {
    try {
      await deleteExpenses(expenseIds);
      fetchExpenses();
    } catch (error) {
      console.error("Error deleting expenses:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Expense Tracker</h1>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="add-expense">Add Expense</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <CardDescription>Overview of your expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <Overview expenses={expenses} categories={categories} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Expenses</CardTitle>
              <CardDescription>Manage your expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <ExpensesDataTable
                expenses={expenses}
                categories={categories}
                onUpdateExpense={handleUpdateExpense}
                onDeleteExpenses={handleDeleteExpenses}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add-expense">
          <Card>
            <CardHeader>
              <CardTitle>Add New Expense</CardTitle>
              <CardDescription>
                Enter the details of your new expense
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expense Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Expense Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Amount"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem
                                key={category._id}
                                value={category._id}
                              >
                                <div className="flex items-center">
                                  <div
                                    className="w-4 h-4 rounded-full mr-2"
                                    style={{ backgroundColor: category.color }}
                                  ></div>
                                  {category.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-[240px] pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() ||
                                date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Add Expense</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Category Management</CardTitle>
              <CardDescription>
                Add, edit, or delete expense categories
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
      </Tabs>
    </div>
  );
}
