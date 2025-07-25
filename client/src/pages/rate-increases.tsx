import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";

import { formatDisplayDate } from "@/lib/utils/date-utils";
import { RateIncreaseDialog } from "@/components/dialogs/rate-increase-dialog";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, Calendar, Building, Percent } from "lucide-react";
import { getMonthsSinceClass } from "@/lib/utils/date-utils";
import { useAppContext } from "@/providers/app-provider";

export default function RateIncreases() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState("0");
  const [minMonths, setMinMonths] = useState("0");
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [showRateIncreaseDialog, setShowRateIncreaseDialog] = useState(false);
  
  const rowsPerPage = 10;
  const { toast } = useToast();
  const { setActiveRateIncreaseCount } = useAppContext();

  const { data: increases = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: [`/api/reminders/rental-increases?month=${selectedMonth}&minMonths=${minMonths}`],
    staleTime: 60000, // 1 minute
  });

  // Ensure increases is always an array
  const increasesList = Array.isArray(increases) ? increases : [];

  // Update badge count
  useEffect(() => {
    if (increasesList) {
      // Only count current month for badge
      if (selectedMonth === (new Date().getMonth() + 1).toString()) {
        setActiveRateIncreaseCount(increasesList.length);
      }
    }
  }, [increasesList, selectedMonth, setActiveRateIncreaseCount]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setCurrentPage(1);
  };

  const handleMinMonthsChange = (months: string) => {
    setMinMonths(months);
    setCurrentPage(1);
  };

  const handleProcessRateIncrease = (address: string) => {
    setSelectedProperty(address);
    setShowRateIncreaseDialog(true);
  };

  // Sort by oldest rate increase date (oldest first) - properties needing attention appear at top
  const sortedIncreases = increasesList.sort((a, b) => {
    const dateA = new Date(a.latestRateIncreaseDate);
    const dateB = new Date(b.latestRateIncreaseDate);
    return dateA.getTime() - dateB.getTime(); // Ascending order (oldest first)
  });

  const totalItems = sortedIncreases.length || 0;
  const paginatedData = sortedIncreases.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const months = [
    { value: "0", label: "All Months" },
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const monthsOptions = [
    { value: "0", label: "Any" },
    { value: "6", label: "6+ months" },
    { value: "8", label: "8+ months" },
    { value: "10", label: "10+ months" },
    { value: "12", label: "12+ months" },
  ];

  const columns = [
    {
      header: "Property Address",
      accessorKey: "propertyAddress",
      cell: (row: any) => (
        <div>
          <div className="font-medium">{row.propertyAddress}</div>
          <div className="text-xs text-neutral-medium">{row.serviceType}</div>
        </div>
      ),
    },
    {
      header: "Last Increase",
      accessorKey: "latestRateIncreaseDate",
      cell: (row: any) => formatDisplayDate(row.latestRateIncreaseDate),
    },
    {
      header: "Months Since",
      accessorKey: "monthsSinceIncrease",
      cell: (row: any) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getMonthsSinceClass(row.monthsSinceIncrease)}`}>
          {row.monthsSinceIncrease} months
        </span>
      ),
    },
    {
      header: "Next Allowable",
      accessorKey: "nextAllowableRentalIncreaseDate",
      cell: (row: any) => formatDisplayDate(row.nextAllowableRentalIncreaseDate),
    },
    {
      header: "Reminder Date",
      accessorKey: "reminderDate",
      cell: (row: any) => (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-warning" />
          {formatDisplayDate(row.reminderDate)}
        </div>
      ),
    },
    {
      header: "Actions",
      accessorKey: (row: any) => (
        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleProcessRateIncrease(row.propertyAddress)}
            className="text-primary hover:text-primary-dark"
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Process
          </Button>
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-semibold mb-2 md:mb-0">Rental Rate Increases</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Rate Increase Reminders</CardTitle>
          <CardDescription>
            View and process rental rate increases that are due.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 sm:mb-0">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-secondary" />
                <span className="font-medium">Month:</span>
                <Select 
                  value={selectedMonth}
                  onValueChange={handleMonthChange}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Percent className="h-5 w-5 text-info" />
                <span className="font-medium">Months Since:</span>
                <Select 
                  value={minMonths}
                  onValueChange={handleMinMonthsChange}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Select minimum months" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthsOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <span className="font-medium">{totalItems} reminders found</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Simple display of data */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-lg font-medium mb-4 text-black">Rate Increase Reminders ({increasesList.length} total)</h3>
        
        <div className="space-y-3">
          {(paginatedData || []).map((item: any, index: number) => (
            <div key={index} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold text-lg text-black">{item.propertyAddress}</div>
                  <div className="text-sm text-gray-700 mt-1">{item.serviceType}</div>
                  <div className="mt-2 flex gap-4">
                    <span className="text-sm text-black">
                      <strong>Last Increase:</strong> {formatDisplayDate(item.latestRateIncreaseDate)}
                    </span>
                    <span className="text-sm text-black">
                      <strong>Next Allowable:</strong> {formatDisplayDate(item.nextAllowableRentalIncreaseDate)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    item.monthsSinceIncrease <= 7 
                      ? 'bg-green-100 text-green-800' 
                      : item.monthsSinceIncrease <= 12 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-red-100 text-red-800'
                  }`}>
                    {item.monthsSinceIncrease} months since
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleProcessRateIncrease(item.propertyAddress)}
                    className="text-blue-600 hover:text-blue-800 border-blue-300"
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Process
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Rate Increase Dialog */}
      <RateIncreaseDialog
        propertyAddress={selectedProperty}
        isOpen={showRateIncreaseDialog}
        onClose={() => {
          setShowRateIncreaseDialog(false);
          refetch();
        }}
      />
    </div>
  );
}
