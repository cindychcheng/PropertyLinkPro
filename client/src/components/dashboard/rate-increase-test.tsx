import { useQuery } from "@tanstack/react-query";

export function RateIncreaseTest() {
  const { data: reminders = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['/api/reminders/rental-increases'],
    staleTime: 60000,
  });

  const reminderList = Array.isArray(reminders) ? reminders : [];

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="font-medium mb-4">Rate Increase Test - {reminderList.length} items</h3>
      
      {isLoading ? (
        <div className="text-blue-600">Loading...</div>
      ) : reminderList.length > 0 ? (
        <div className="space-y-3">
          {reminderList.slice(0, 3).map((item: any, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="font-semibold text-gray-900">{item.propertyAddress}</div>
              <div className="text-sm text-gray-600 mt-1">
                Service: {item.serviceType}
              </div>
              <div className="text-sm text-gray-600">
                Current Rate: ${item.latestRentalRate?.toLocaleString()}
              </div>
              <div className="text-sm font-medium text-red-600">
                {item.monthsSinceIncrease} months since last increase
              </div>
              <button className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                Process Increase
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500">No rate increases found</div>
      )}
    </div>
  );
}