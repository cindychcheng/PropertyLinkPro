import { SearchBar } from "./search-bar";

export function Header() {
  return (
    <header className="border-b bg-white dark:bg-gray-950 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile: Add left padding to avoid hamburger menu overlap */}
          <div className="lg:hidden w-12"></div>
          {/* Desktop: Show full title */}
          <h1 className="hidden lg:block text-xl font-semibold text-gray-900 dark:text-white">
            PropertyHub
          </h1>
          {/* Mobile: Show "Property Management" with left spacing */}
          <h1 className="lg:hidden text-lg font-semibold text-gray-900 dark:text-white">
            Property Management
          </h1>
        </div>
        <div className="flex-1 max-w-md mx-4 lg:mx-8">
          <SearchBar />
        </div>
        <div className="flex items-center space-x-4">
          {/* Additional header items can go here */}
        </div>
      </div>
    </header>
  );
}