import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Category } from "@/types";
import { useToast } from "@/components/hooks/use-toast";
import { CircleAlert } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Category name must be at least 2 characters.",
  }),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
    message: "Invalid color format. Use hex color (e.g., #FF0000)",
  }),
});

interface EditCategoryDialogProps {
  category: Category;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCategory: Category) => void;
}

export function EditCategoryDialog({
  category,
  categories,
  isOpen,
  onClose,
  onSave,
}: EditCategoryDialogProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: category.name,
      color: category.color,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Check if the name already exists (excluding the current category)
    if (
      categories.some(
        (cat) =>
          cat._id !== category._id &&
          cat.name.toLowerCase() === values.name.trim().toLowerCase()
      )
    ) {
      toast({
        title: "Error",
        description: (
          <div className="flex items-center gap-2">
            <CircleAlert className="h-4 w-4 text-white" />
            <span>A Category with this name exists. Add a distinct name.</span>
          </div>
        ),
        variant: "destructive",
      });
      return;
    }

    // Check if the color already exists (excluding the current category)
    if (
      categories.some(
        (cat) =>
          cat._id !== category._id &&
          cat.color.toLowerCase() === values.color.toLowerCase()
      )
    ) {
      toast({
        title: "Error",
        description: (
          <div className="flex items-center gap-2">
            <CircleAlert className="h-4 w-4 text-white" />
            <span>
              A Category with this color exists. Choose a distinct color.
            </span>
          </div>
        ),
        variant: "destructive",
      });
      return;
    }

    onSave({ ...category, name: values.name, color: values.color });
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter category name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Color</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <Input type="color" {...field} className="w-12 p-1" />
                      <Input {...field} placeholder="#000000" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
