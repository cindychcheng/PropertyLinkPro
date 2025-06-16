import { SearchBar } from "./search-bar";

export function Header() {
  return (
    <header className="border-b bg-white dark:bg-gray-950 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            PropertyHub
          </h1>
        </div>
        <div className="flex-1 max-w-md mx-8">
          <SearchBar />
        </div>
        <div className="flex items-center space-x-4">
          {/* Additional header items can go here */}
        </div>
      </div>
    </header>
  );
}