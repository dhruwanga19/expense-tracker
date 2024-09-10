export interface Expense {
    _id: string;
    name: string;
    amount: number;
    date: Date;
    categoryId: string;
    category?: {
      _id: string;
      name: string;
      color: string;
    };
  }
  
  export interface Category {
    _id: string;
    name: string;
    color: string;
  }

  interface AnalysisResults {
    extractedText: string;
    total: number;
  }
  
  export interface Bill {
    _id: string;
    fileName: string;
    fileType: string;
    uploadDate: string;
    processedDate: string;
    status: string;
    analysisResults: AnalysisResults;
    generatedExpenses: Expense[];
  }