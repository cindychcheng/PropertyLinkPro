import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Layout } from "@/components/layout/layout";
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
  const [selectedMonth, setSelectedMonth] = useState(
    (new Date().getMonth() + 1).toString()
  );
  const [minMonths, setMinMonths] = useState("0");
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [showRateIncreaseDialog, setShowRateIncreaseDialog] = useState(false);
  
  const rowsPerPage = 10;
  const { toast } = useToast();
  const { setActiveRateIncreaseCount } = useAppContext();

  const { data: increases, isLoading, refetch } = useQuery({
    queryKey: [`/api/reminders/rental-increases?month=${selectedMonth}&minMonths=${minMonths}`],
    staleTime: 60000, // 1 minute
  });

  // Update badge count
  useEffect(() => {
    if (increases) {
      // Only count current month for badge
      if (selectedMonth === (new Date().getMonth() + 1).toString()) {
        setActiveRateIncreaseCount(increases.length);
      }
    }
  }, [increases, selectedMonth, setActiveRateIncreaseCount]);

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

  const totalItems = increases?.length || 0;
  const paginatedData = increases?.slice(
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
    <Layout>
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
      
      <DataTable
        columns={columns}
        data={paginatedData}
        isLoading={isLoading}
        emptyMessage="No rental increases due with current filters."
        rowsPerPage={rowsPerPage}
        currentPage={currentPage}
        totalItems={totalItems}
        onPageChange={handlePageChange}
      />
      
      {/* Rate Increase Dialog */}
      <RateIncreaseDialog
        propertyAddress={selectedProperty}
        isOpen={showRateIncreaseDialog}
        onClose={() => {
          setShowRateIncreaseDialog(false);
          refetch();
        }}
      />
    </Layout>
  );
}
