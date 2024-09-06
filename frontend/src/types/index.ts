export interface Expense {
    _id: string;
    name: string;
    amount: number;
    date: Date;
    categoryId: string;
    category?: {
      _id: string;
      name: string;
    };
  }
  
  export interface Category {
    _id: string;
    name: string;
  }