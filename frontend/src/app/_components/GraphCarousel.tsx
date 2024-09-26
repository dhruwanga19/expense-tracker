import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MonthlyExpensesGraph from "./MonthlyExpensesGraph";
import ForecastGraph from "./ForecastGraph";
import CategoryGraph from "./CategoryGraph";

export interface GraphData {
  type: "monthly expense" | "expense forecast" | "categorical expense";
  data?: any;
}

interface CarouselProps {
  graphs: GraphData[];
  loadGraphData: (type: GraphData["type"]) => Promise<any>;
}

const Carousel: React.FC<CarouselProps> = ({ graphs, loadGraphData }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedData, setLoadedData] = useState<Record<string, any>>({});

  const loadData = useCallback(
    async (type: GraphData["type"]) => {
      if (!loadedData[type]) {
        const data = await loadGraphData(type);
        setLoadedData((prev) => ({ ...prev, [type]: data }));
      }
    },
    [loadGraphData, loadedData]
  );

  useEffect(() => {
    loadData(graphs[currentIndex].type);
  }, [currentIndex, graphs, loadData]);

  const nextGraph = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % graphs.length);
  }, [graphs.length]);

  const prevGraph = useCallback(() => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + graphs.length) % graphs.length
    );
  }, [graphs.length]);

  const renderGraph = useCallback(() => {
    const { type, data: initialData } = graphs[currentIndex];
    const data = loadedData[type] || initialData;

    if (!data) {
      return <div>Loading...</div>;
    }

    switch (type) {
      case "monthly expense":
        return <MonthlyExpensesGraph data={data} />;
      case "expense forecast":
        return <ForecastGraph data={data} />;
      case "categorical expense":
        return <CategoryGraph data={data} />;
      default:
        return null;
    }
  }, [currentIndex, graphs, loadedData]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center">
          {graphs[currentIndex].type.charAt(0).toUpperCase() +
            graphs[currentIndex].type.slice(1)}{" "}
          Graph
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[400px] relative">
        <Button
          onClick={prevGraph}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10"
          size="icon"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {renderGraph()}
        <Button
          onClick={nextGraph}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10"
          size="icon"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default Carousel;
