import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";

import { formatBirthday, formatDisplayDate } from "@/lib/utils/date-utils";
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
import { Cake, Gift, Building } from "lucide-react";
import { useAppContext } from "@/providers/app-provider";

export default function Birthdays() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(
    (new Date().getMonth() + 1).toString()
  );
  
  const rowsPerPage = 10;
  const { toast } = useToast();
  const { setActiveBirthdayCount } = useAppContext();

  const { data: birthdays = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: [`/api/reminders/birthdays?month=${selectedMonth}`],
    staleTime: 60000, // 1 minute
  });

  // Update badge count
  useEffect(() => {
    if (birthdays) {
      // Only count current month for badge
      if (selectedMonth === (new Date().getMonth() + 1).toString()) {
        setActiveBirthdayCount(birthdays.length);
      }
    }
  }, [birthdays, selectedMonth, setActiveBirthdayCount]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setCurrentPage(1);
  };

  const totalItems = Array.isArray(birthdays) ? birthdays.length : 0;
  const paginatedData = Array.isArray(birthdays) ? birthdays.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  ) : [];

  const months = [
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

  const columns = [
    {
      header: "Name",
      accessorKey: "name",
      cell: (row: any) => (
        <div className="font-medium">{row.name}</div>
      ),
    },
    {
      header: "Role",
      accessorKey: "role",
      cell: (row: any) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          row.role === 'Tenant' 
            ? 'bg-primary-light bg-opacity-20 text-primary-dark' 
            : 'bg-info bg-opacity-20 text-info'
        }`}>
          {row.role}
        </span>
      ),
    },
    {
      header: "Contact Number",
      accessorKey: "contactNumber",
      cell: (row: any) => row.contactNumber || "N/A",
    },
    {
      header: "Birthday",
      accessorKey: "birthday",
      cell: (row: any) => (
        <div className="flex items-center">
          <Cake className="h-4 w-4 mr-2 text-secondary" />
          {formatBirthday(row.birthday)}
        </div>
      ),
    },
    {
      header: "Property",
      accessorKey: "propertyAddress",
      cell: (row: any) => (
        <div className="flex items-center">
          <Building className="h-4 w-4 mr-2 text-neutral-dark" />
          {row.propertyAddress}
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
            className="text-secondary hover:text-secondary"
          >
            <Gift className="h-3 w-3 mr-1" />
            Send Card
          </Button>
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-semibold mb-2 md:mb-0">Birthday Reminders</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Birthday Cards</CardTitle>
          <CardDescription>
            View upcoming birthdays and manage birthday card reminders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0 flex items-center space-x-2">
              <Cake className="h-5 w-5 text-secondary" />
              <span className="font-medium">Select Month:</span>
              <Select 
                value={selectedMonth}
                onValueChange={handleMonthChange}
              >
                <SelectTrigger className="w-[180px]">
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
            <div>
              <span className="font-medium">{totalItems} birthdays in {months.find(m => m.value === selectedMonth)?.label}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <DataTable
        columns={columns}
        data={paginatedData}
        isLoading={isLoading}
        emptyMessage={`No birthdays found for ${months.find(m => m.value === selectedMonth)?.label}.`}
        rowsPerPage={rowsPerPage}
        currentPage={currentPage}
        totalItems={totalItems}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
