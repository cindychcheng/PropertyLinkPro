import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatDisplayDate } from "@/lib/utils/date-utils";
import { Skeleton } from "@/components/ui/skeleton";

type BirthdayItemProps = {
  name: string;
  contactNumber: string;
  role: 'Landlord' | 'Tenant';
  birthday: Date;
  propertyAddress: string;
};

function BirthdayItem({
  name,
  contactNumber,
  role,
  birthday,
  propertyAddress,
}: BirthdayItemProps) {
  return (
    <tr className="hover:bg-neutral-lightest border-b border-neutral-light">
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="truncate font-medium">{name}</div>
        <div className="text-xs text-neutral-medium truncate">{contactNumber}</div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          role === 'Tenant' 
            ? 'bg-primary-light bg-opacity-20 text-primary-dark' 
            : 'bg-info bg-opacity-20 text-info'
        }`}>
          {role}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm">{formatDisplayDate(birthday)}</td>
      <td className="px-4 py-3 whitespace-nowrap text-right text-sm truncate">
        {propertyAddress}
      </td>
    </tr>
  );
}

export function BirthdayReminders() {
  const { toast } = useToast();

  const { data: birthdays = [], isLoading, error } = useQuery({
    queryKey: ['/api/reminders/birthdays'],
    staleTime: 60000, // 1 minute
  });

  if (error) {
    toast({
      title: "Error fetching birthday reminders",
      description: (error as Error).message,
      variant: "destructive",
    });
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-4 py-3 border-b border-neutral-light flex items-center justify-between">
        <h3 className="font-medium">Upcoming Birthdays</h3>
        <a href="/birthdays" className="text-primary text-sm hover:underline">
          View All
        </a>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed">
          <thead>
            <tr className="bg-neutral-lightest">
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider w-2/5">
                Name
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider w-1/5">
                Role
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider w-1/5">
                Birthday
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-neutral-dark uppercase tracking-wider w-1/5">
                Property
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <tr key={i} className="border-b border-neutral-light">
                  <td className="px-4 py-3">
                    <Skeleton className="h-5 w-full mb-1" />
                    <Skeleton className="h-3 w-3/4" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-5 w-20" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-5 w-16" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Skeleton className="h-5 w-16 ml-auto" />
                  </td>
                </tr>
              ))
            ) : birthdays && birthdays.length > 0 ? (
              birthdays.slice(0, 3).map((item: any, index: number) => (
                <BirthdayItem
                  key={index}
                  name={item.name}
                  contactNumber={item.contactNumber || 'N/A'}
                  role={item.role}
                  birthday={new Date(item.birthday)}
                  propertyAddress={item.propertyAddress}
                />
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-3 text-center text-neutral-medium">
                  No upcoming birthdays this month
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
