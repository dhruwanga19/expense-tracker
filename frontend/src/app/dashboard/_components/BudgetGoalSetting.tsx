import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BudgetGoal, Category } from "@/types";
import {
  addBudgetGoal,
  addCategory,
  deleteBudgetGoal,
  updateBudgetGoal,
} from "@/utils/api";
import { useToast } from "@/components/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const budgetGoalSchema = z.object({
  categoryId: z.string().min(1, { message: "Please select a category." }),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number.",
  }),
  period: z.enum(["weekly", "monthly"]),
});

const categorySchema = z.object({
  name: z
    .string()
    .min(2, { message: "Category name must be at least 2 characters." }),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
    message: "Please enter a valid hex color code.",
  }),
});

interface BudgetGoalSettingProps {
  categories: Category[];
  budgetGoals: BudgetGoal[];
  onBudgetGoalAdded: () => void;
  onBudgetGoalUpdated: () => void;
  onBudgetGoalDeleted: () => void;
  onCategoryAdded: () => void;
}

export const BudgetGoalSetting: React.FC<BudgetGoalSettingProps> = ({
  categories,
  budgetGoals,
  onBudgetGoalAdded,
  onBudgetGoalUpdated,
  onBudgetGoalDeleted,
  onCategoryAdded,
}) => {
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<BudgetGoal | null>(null);
  const { toast } = useToast();

  const budgetGoalForm = useForm<z.infer<typeof budgetGoalSchema>>({
    resolver: zodResolver(budgetGoalSchema),
    defaultValues: {
      categoryId: "",
      amount: "",
      period: "monthly",
    },
  });

  const categoryForm = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      color: "#000000",
    },
  });

  const handleDeleteGoal = async () => {
    if (deletingGoalId) {
      try {
        await deleteBudgetGoal(deletingGoalId);
        onBudgetGoalDeleted();
        toast({
          title: "Success",
          description: "Budget goal deleted successfully.",
          variant: "default",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete budget goal.",
          variant: "destructive",
        });
      }
      setIsDeleteDialogOpen(false);
      setDeletingGoalId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingGoal(null);
    budgetGoalForm.reset({
      categoryId: "",
      amount: "",
      period: "monthly",
    });
  };

  const handleEditGoal = (goal: BudgetGoal) => {
    setEditingGoal(goal);
    budgetGoalForm.reset({
      categoryId: goal.categoryId,
      amount: goal.amount.toString(),
      period: goal.period,
    });
  };

  const onSubmitBudgetGoal = async (
    values: z.infer<typeof budgetGoalSchema>
  ) => {
    try {
      const goalData: Omit<BudgetGoal, "_id"> = {
        categoryId: values.categoryId,
        amount: parseFloat(values.amount),
        period: values.period,
      };

      if (editingGoal) {
        await updateBudgetGoal({ ...goalData, _id: editingGoal._id });
        onBudgetGoalUpdated();
        setEditingGoal(null);
        toast({
          title: "Success",
          description: "Budget goal updated successfully.",
          variant: "default",
        });
      } else {
        await addBudgetGoal(goalData);
        onBudgetGoalAdded();
        toast({
          title: "Success",
          description: "Budget goal added successfully.",
          variant: "default",
        });
      }
      budgetGoalForm.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${editingGoal ? "update" : "add"} budget goal.`,
        variant: "destructive",
      });
    }
  };

  const onSubmitCategory = async (values: z.infer<typeof categorySchema>) => {
    try {
      await addCategory(values);
      toast({
        title: "Success",
        description: "New category added successfully.",
        variant: "default",
      });
      setIsAddCategoryDialogOpen(false);
      categoryForm.reset();
      onCategoryAdded();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add new category. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <Form {...budgetGoalForm}>
        <form
          onSubmit={budgetGoalForm.handleSubmit(onSubmitBudgetGoal)}
          className="space-y-4"
        >
          <FormField
            control={budgetGoalForm.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsAddCategoryDialogOpen(true)}
                      className="flex w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Category
                    </Button>
                    {categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        <div className="flex items-center">
                          <div
                            className="w-4 h-4 rounded-full mr-2"
                            style={{ backgroundColor: cat.color }}
                          ></div>
                          {cat.name}
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
            control={budgetGoalForm.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="number" placeholder="Budget amount" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={budgetGoalForm.control}
            name="period"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit">
            {editingGoal ? "Update" : "Set"} Budget Goal
          </Button>
          {editingGoal && (
            <Button
              type="button"
              variant="outline"
              onClick={
                // setEditingGoal(null);
                // budgetGoalForm.reset();
                handleCancelEdit
              }
            >
              Cancel Edit
            </Button>
          )}
        </form>
      </Form>
      <Table className="mt-8">
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {budgetGoals.map((goal) => (
            <TableRow key={goal._id}>
              <TableCell>
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full mr-2"
                    style={{
                      backgroundColor: categories.find(
                        (c) => c._id === goal.categoryId
                      )?.color,
                    }}
                  ></div>
                  {categories.find((c) => c._id === goal.categoryId)?.name}
                </div>
              </TableCell>
              <TableCell>${goal.amount.toFixed(2)}</TableCell>
              <TableCell>{goal.period}</TableCell>
              <TableCell>
                <Button size="sm" onClick={() => handleEditGoal(goal)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setDeletingGoalId(goal._id);
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog
        open={isAddCategoryDialogOpen}
        onOpenChange={setIsAddCategoryDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          <Form {...categoryForm}>
            <form
              onSubmit={categoryForm.handleSubmit(onSubmitCategory)}
              className="space-y-4"
            >
              <FormField
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={categoryForm.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input type="color" {...field} className="w-12 p-1" />
                        <Input {...field} placeholder="#000000" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Add Category</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Budget Goal</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this budget goal? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteGoal}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
