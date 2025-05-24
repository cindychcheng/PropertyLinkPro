import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type RateIncreaseItemProps = {
  propertyAddress: string;
  serviceType: string;
  latestRateIncreaseDate: Date;
  monthsSinceIncrease: number;
  onProcess: (address: string) => void;
};

function RateIncreaseItem({
  propertyAddress,
  serviceType,
  latestRateIncreaseDate,
  monthsSinceIncrease,
  onProcess
}: RateIncreaseItemProps) {
  return (
    <tr className="border-b border-neutral-light hover:bg-neutral-50">
      <td className="px-4 py-3">
        <div className="font-medium text-neutral-dark">{propertyAddress}</div>
        <div className="text-sm text-neutral-medium">{serviceType}</div>
      </td>
      <td className="px-4 py-3 text-neutral-dark">
        {latestRateIncreaseDate.toLocaleDateString()}
      </td>
      <td className="px-4 py-3 text-neutral-dark">
        {monthsSinceIncrease} months
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={() => onProcess(propertyAddress)}
          className="text-primary hover:text-primary-dark text-sm font-medium"
        >
          Process
        </button>
      </td>
    </tr>
  );
}

export function RateIncreaseReminders({ 
  onProcessIncrease 
}: { 
  onProcessIncrease: (propertyAddress: string) => void 
}) {
  const { toast } = useToast();

  const { data: reminders = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['/api/reminders/rental-increases'],
    staleTime: 60000, // 1 minute
  });

  // Ensure reminders is always an array
  const reminderList = Array.isArray(reminders) ? reminders : [];

  if (error) {
    toast({
      title: "Error fetching rental increase reminders",
      description: (error as Error).message,
      variant: "destructive",
    });
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-4 py-3 border-b border-neutral-light flex items-center justify-between">
        <h3 className="font-medium">Rental Rate Increases Due</h3>
        <a href="/rate-increases" className="text-primary text-sm hover:underline">
          View All
        </a>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-neutral-lightest">
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                Property
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                Last Increase
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                Months Since
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-neutral-dark uppercase tracking-wider">
                Action
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
            ) : reminderList.length > 0 ? (
              reminderList.slice(0, 3).map((item: any, index: number) => (
                <RateIncreaseItem
                  key={index}
                  propertyAddress={item.propertyAddress}
                  serviceType={item.serviceType}
                  latestRateIncreaseDate={new Date(item.latestRateIncreaseDate)}
                  monthsSinceIncrease={item.monthsSinceIncrease}
                  onProcess={onProcessIncrease}
                />
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-3 text-center text-neutral-medium">
                  No rate increases due for review
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}