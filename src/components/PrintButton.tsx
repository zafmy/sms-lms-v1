"use client";

const PrintButton = () => {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden bg-lamaSky text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-lamaSkyLight transition-colors"
    >
      Print Report Card
    </button>
  );
};

export default PrintButton;
