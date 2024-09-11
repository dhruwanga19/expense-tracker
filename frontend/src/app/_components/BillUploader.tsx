import React, { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadBill, getBillDetails, confirmExpenses } from "@/utils/api";
import ReactCrop, {
  Crop,
  PixelCrop,
  centerCrop,
  makeAspectCrop,
  PercentCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Loader2,
  CircleCheck,
  CircleAlert,
  PlusCircle,
  SeparatorHorizontal,
} from "lucide-react";
import { AddExpenseForm } from "./AddExpenseForm";
import { Category, Expense } from "@/types";
import { useToast } from "@/components/hooks/use-toast";
import * as z from "zod";
import { Bill } from "@/types";
import { on } from "events";

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

type FormSchema = z.infer<typeof formSchema>;

interface BillUploaderProps {
  categories: Category[];
  onAddExpense: (values: FormSchema) => Promise<void>;
  onUpdateBillExpense: (billId: string, expense: Expense) => Promise<void>;
  onAddCategory: (name: string, color: string) => Promise<void>;
}

export function BillUploader({
  categories,
  onAddExpense,
  onUpdateBillExpense,
  onAddCategory,
}: BillUploaderProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [billDetails, setBillDetails] = useState<Bill | null>(null);
  const [editedExpenses, setEditedExpenses] = useState<Expense[]>([]);
  const [newExpenses, setNewExpenses] = useState<Expense[]>([]);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [billId, setBillId] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setCropDialogOpen(true);
    }
  };

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      const crop = centerCrop(
        makeAspectCrop(
          {
            unit: "%",
            width: 90,
          },
          16 / 9,
          width,
          height
        ),
        width,
        height
      );
      setCrop(crop);
    },
    []
  );

  const handleCropChange = (crop: Crop) => {
    setCrop(crop);
  };

  const handleCropComplete = (crop: PixelCrop) => {
    setCompletedCrop(crop);
  };

  const handleUpload = async () => {
    if (!previewUrl || !completedCrop || !imgRef.current) return;

    setUploading(true);
    setProcessing(true);
    setCropDialogOpen(false);

    try {
      const canvas = document.createElement("canvas");
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = completedCrop.width;
      canvas.height = completedCrop.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height
      );

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else throw new Error("Canvas to Blob conversion failed");
        }, "image/jpeg");
      });

      const croppedFile = new File([blob], "cropped_bill.jpg", {
        type: "image/jpeg",
      });

      const formData = new FormData();
      formData.append("bill", croppedFile);

      const uploadResponse = await uploadBill(formData);
      setBillId(uploadResponse.id);
      const details: Bill = await getBillDetails(uploadResponse.id);
      setBillDetails(details);

      setEditedExpenses(
        details.generatedExpenses.map((expense: Expense) => ({
          ...expense,
          categoryId: expense.categoryId || "",
        }))
      );

      toast({
        title: "Success",
        description: (
          <div className="flex items-center gap-2">
            <CircleCheck className="h-4 w-4 text-green-500" />
            <span>Bill uploaded and processed successfully.</span>
          </div>
        ),
        variant: "default",
      });
    } catch (error) {
      console.error("Error uploading and processing bill:", error);
      toast({
        title: "Error",
        description: (
          <div className="flex items-center gap-2">
            <CircleAlert className="h-4 w-4 text-white" />
            <span>
              An error occurred while processing the bill. Please try again.
            </span>
          </div>
        ),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const handleAddMoreExpenses = () => {
    const newExpense: Expense = {
      _id: "", // This will be set by the backend
      name: "",
      amount: 0,
      categoryId: "",
      date: new Date(),
    };
    setNewExpenses([...newExpenses, newExpense]);
  };

  const handleUpdateNewExpense = async (
    index: number,
    values: z.infer<typeof formSchema>
  ): Promise<void> => {
    return new Promise<void>((resolve) => {
      setNewExpenses((prevExpenses) => {
        const updatedExpenses = [...prevExpenses];
        updatedExpenses[index] = {
          ...updatedExpenses[index],
          name: values.name,
          amount: Number(values.amount),
          categoryId: values.categoryId,
          date: values.date,
        };
        return updatedExpenses;
      });
      resolve();
    });
  };

  const handleRemoveNewExpense = (index: number) => {
    const updatedNewExpenses = newExpenses.filter((_, i) => i !== index);
    setNewExpenses(updatedNewExpenses);
  };

  const handleUpdateBillExpense = async (index: number, values: FormSchema) => {
    if (!billId) {
      toast({
        title: "Error",
        description: (
          <div className="flex items-center gap-2">
            <CircleAlert className="h-4 w-4 text-white" />
            <span>Unable to update expense: No active bill.</span>
          </div>
        ),
        variant: "destructive",
      });
      return;
    }
    try {
      const updatedExpense: Expense = {
        ...editedExpenses[index],
        name: values.name,
        amount: Number(values.amount),
        categoryId: values.categoryId,
        date: values.date,
      };
      await onUpdateBillExpense(billId, updatedExpense);
      const updatedExpenses = [...editedExpenses];
      updatedExpenses[index] = updatedExpense;
      setEditedExpenses(updatedExpenses);
      toast({
        title: "Success",
        description: (
          <div className="flex items-center gap-2">
            <CircleCheck className="h-4 w-4 text-green-500" />
            <span>Expense has been updated successfully.</span>
          </div>
        ),
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (
          <div className="flex items-center gap-2">
            <CircleAlert className="h-4 w-4 text-white" />
            <span>
              An error occurred while updating the expense. Please try again.
            </span>
          </div>
        ),
        variant: "destructive",
      });
    }
  };

  const handleRemoveExpense = (index: number) => {
    const updatedExpenses = editedExpenses.filter((_, i) => i !== index);
    setEditedExpenses(updatedExpenses);
  };

  const validateExpenses = (expenses: Expense[]): boolean => {
    return expenses.every(
      (expense) =>
        expense.categoryId && expense.categoryId !== "000000000000000000000000"
    );
  };

  const handleConfirmExpenses = async () => {
    if (!billId) return;

    const expensesToConfirm = [
      ...editedExpenses,
      ...newExpenses.map((expense) => ({
        ...expense,
        isNew: true, // Flag to indicate this is a new expense
      })),
    ];

    if (!validateExpenses(expensesToConfirm)) {
      toast({
        title: "Error",
        description: (
          <div className="flex items-center gap-2">
            <CircleAlert className="h-4 w-4 text-white" />
            <span>
              Please select a category for all expenses before confirming.
            </span>
          </div>
        ),
        variant: "destructive",
      });
      return;
    }

    try {
      await confirmExpenses(billId, expensesToConfirm);
      toast({
        title: "Success",
        description: (
          <div className="flex items-center gap-2">
            <CircleCheck className="h-4 w-4 text-green-500" />
            <span>Expenses have been confirmed and saved successfully.</span>
          </div>
        ),
        variant: "default",
      });
      setBillDetails(null);
      setEditedExpenses([]);
      setBillId(null);
    } catch (error) {
      console.error("Error confirming expenses:", error);
      toast({
        title: "Error",
        description: (
          <div className="flex items-center gap-2">
            <CircleAlert className="h-4 w-4 text-white" />
            <span>
              An error occurred while confirming expenses. Please try again.
            </span>
          </div>
        ),
        variant: "destructive",
      });
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between max-w-screen-sm">
        <Input
          type="file"
          onChange={handleFileChange}
          accept="image/*,.pdf"
          className="bg-stone-300 rounded-lg "
        />
      </div>

      <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
            <DialogDescription>
              Crop your expenses and hit "Process Bill" button below.
            </DialogDescription>
          </DialogHeader>
          {previewUrl && (
            <div className="flex-grow overflow-auto">
              <ReactCrop
                crop={crop}
                onChange={handleCropChange}
                onComplete={handleCropComplete}
                aspect={undefined}
              >
                <img
                  ref={imgRef}
                  src={previewUrl}
                  alt="Bill preview"
                  onLoad={onImageLoad}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "calc(90vh - 200px)", // Adjust this value as needed
                    objectFit: "contain",
                  }}
                />
              </ReactCrop>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCropDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? "Processing..." : "Process Bill"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {processing && (
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p>Processing your image...</p>
        </div>
      )}

      {billDetails && (
        <div>
          <span className="text-gray-400 text-sm">
            Note: The Detected Expenses might not be 100% accurate, feel free to
            add or edit your expenses and hit the "Update".
          </span>
          <h3 className="text-lg font-semibold">Processed Bill Details:</h3>
          <p>Total Amount: ${billDetails.analysisResults.total.toFixed(2)}</p>
          <h4 className="text-md font-semibold mt-2">Extracted Text:</h4>
          <pre className="bg-gray-100 p-2 rounded mt-1 text-sm">
            {billDetails.analysisResults.extractedText}
          </pre>
          <h4 className="text-md font-semibold mt-4">Detected Expenses:</h4>
          {editedExpenses.map((expense, index) => (
            <div key={index} className="mt-4">
              <AddExpenseForm
                categories={categories}
                onAddExpense={(values) =>
                  handleUpdateBillExpense(index, values)
                }
                initialValues={expense}
                onAddCategory={onAddCategory}
              />
              <Button
                onClick={() => handleRemoveExpense(index)}
                className="mt-2"
              >
                Remove Expense
              </Button>
            </div>
          ))}

          {newExpenses.map((expense, index) => (
            <div key={index} className="mt-4">
              <h4 className="text-md font-semibold mt-4">
                Additional Expenses:
              </h4>

              <AddExpenseForm
                categories={categories}
                onAddExpense={(values) => handleUpdateNewExpense(index, values)}
                initialValues={expense}
                onAddCategory={onAddCategory}
              />
              <Button
                onClick={() => handleRemoveNewExpense(index)}
                className="mt-2"
              >
                Remove Expense
              </Button>
            </div>
          ))}

          <Button onClick={handleAddMoreExpenses} className="mt-4">
            <PlusCircle className="mr-2 h-4 w-4" /> Add More Expenses
          </Button>
          <Button onClick={handleConfirmExpenses} className="mt-4 ml-4">
            Confirm Expenses
          </Button>
        </div>
      )}
    </div>
  );
}
