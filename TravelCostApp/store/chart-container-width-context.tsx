import React, { createContext, useContext } from "react";

const ChartContainerWidthContext = createContext<number | undefined>(undefined);

export function ChartContainerWidthProvider({
  width,
  children,
}: {
  width?: number;
  children: React.ReactNode;
}) {
  return (
    <ChartContainerWidthContext.Provider value={width}>
      {children}
    </ChartContainerWidthContext.Provider>
  );
}

export function useChartContainerWidth(fallbackWidth: number) {
  const measuredWidth = useContext(ChartContainerWidthContext);
  return measuredWidth ?? fallbackWidth;
}
