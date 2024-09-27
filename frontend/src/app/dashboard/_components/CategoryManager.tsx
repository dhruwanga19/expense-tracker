import React, { useState } from "react";
import { Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PlusCircle,
  Pencil,
  Trash2,
  CircleCheck,
  CircleAlert,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EditCategoryDialog } from "./EditCategoryDialog";
import { useToast } from "@/components/hooks/use-toast";

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (name: string, color: string) => Promise<void>;
  onUpdateCategory: (updatedCategory: Category) => void;
  onDeleteCategory: (id: string) => void;
}

export function CategoryManager({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}: CategoryManagerProps) {
  const { toast } = useToast();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#000000");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleAddCategory = async () => {
    if (newCategoryName.trim()) {
      // Check if the name already exists
      if (
        categories.some(
          (cat) =>
            cat.name.toLowerCase() === newCategoryName.trim().toLowerCase()
        )
      ) {
        toast({
          title: "Error",
          description: (
            <div className="flex items-center gap-2">
              <CircleAlert className="h-4 w-4 text-white" />
              <span>
                A Category with this name exists. Add a distinct name.
              </span>
            </div>
          ),
          variant: "destructive",
        });
      }

      // Check if the color already exists
      if (
        categories.some(
          (cat) => cat.color.toLowerCase() === newCategoryColor.toLowerCase()
        )
      ) {
        toast({
          title: "Error",
          description: (
            <div className="flex items-center gap-2">
              <CircleAlert className="h-4 w-4 text-white" />
              <span>
                A Category with same color exists. Choose a distinct color.
              </span>
            </div>
          ),
          variant: "destructive",
        });
        return;
      }

      await onAddCategory(newCategoryName.trim(), newCategoryColor)
        .then(() => {
          toast({
            title: "Success",
            description: (
              <div className="flex items-center gap-2">
                <CircleCheck className="h-4 w-4 text-green-500" />
                <span>
                  Category <strong>{newCategoryName}</strong> added
                  successfully.
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
                  `Failed to add category. Please try again. ${error}`
                </span>
              </div>
            ),
            variant: "destructive",
          });
        });

      setNewCategoryName("");
      setNewCategoryColor("#000000");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Input
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="New category name"
        />
        <Input
          type="color"
          value={newCategoryColor}
          onChange={(e) => setNewCategoryColor(e.target.value)}
          className="w-12 p-1"
        />
        <Button onClick={handleAddCategory}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add
        </Button>
      </div>
      <ul className="space-y-2">
        {categories.map((category) => (
          <li key={category._id} className="flex justify-between items-center">
            <span className="flex items-center">
              <div
                className="w-4 h-4 rounded-full mr-2"
                style={{ backgroundColor: category.color }}
              ></div>
              {category.name}
            </span>
            <div>
              <Button size="sm" onClick={() => setEditingCategory(category)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      Are you sure you want to delete this category?
                    </DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete
                      the category and all its related expenses from our
                      servers.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="destructive"
                      onClick={() => onDeleteCategory(category._id)}
                    >
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </li>
        ))}
      </ul>
      {editingCategory && (
        <EditCategoryDialog
          category={editingCategory}
          categories={categories}
          isOpen={!!editingCategory}
          onClose={() => setEditingCategory(null)}
          onSave={(updatedCategory) => {
            onUpdateCategory(updatedCategory);
            setEditingCategory(null);
          }}
        />
      )}
    </div>
  );
}
