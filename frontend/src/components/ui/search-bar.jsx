import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUpAZ, ArrowDownAZ, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const SearchComponent = ({ data, onResultClick }) => {
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [filteredData, setFilteredData] = useState(data);

  useEffect(() => {
    const lowerCaseQuery = query.toLowerCase().trim();
    let results = data.filter((item) =>
      item.company_name?.toLowerCase().includes(lowerCaseQuery) ||
      item.industry?.toLowerCase().includes(lowerCaseQuery) ||
      item.location?.toLowerCase().includes(lowerCaseQuery)
    );

    if (sortOrder === "asc") {
      results.sort((a, b) => (a.company_name || '').localeCompare(b.company_name || ''));
    } else if (sortOrder === "desc") {
      results.sort((a, b) => (b.company_name || '').localeCompare(a.company_name || ''));
    }

    setFilteredData(results);
  }, [query, sortOrder, data]);

  return (
    <div className="w-full flex flex-col items-center justify-center space-y-4">
      {/* Search Input and Sort Dropdown */}
      <div className="w-full md:w-[60%] max-w-3xl flex flex-col sm:flex-row gap-4">
        {/* Search Bar with Icon */}
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search companies, industries, locations..."
            className="w-full pr-10"
            onChange={(e) => setQuery(e.target.value)}
            value={query}
          />
          <Search
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            size={18}
          />
        </div>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              Sort by
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem 
              onClick={() => setSortOrder("asc")}
              className="flex justify-between items-center"
            >
              <span>Name Ascending</span>
              <ArrowUpAZ className="ml-2 h-4 w-4" />
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setSortOrder("desc")}
              className="flex justify-between items-center"
            >
              <span>Name Descending</span>
              <ArrowDownAZ className="ml-2 h-4 w-4" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search Results with Scroll */}
      <ScrollArea className="h-[500px] w-full md:w-[60%] max-w-3xl border rounded-md">
        <div className="p-4 space-y-4">
          {filteredData.length > 0 ? (
            filteredData.map((item, idx) => (
              <div
                key={idx}
                onClick={() => onResultClick && onResultClick(item)}
                className="bg-card text-card-foreground p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <h3 className="text-lg font-medium leading-none">
                  {item.company_name || 'N/A'}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {item.description || item.industry || 'No description available'}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {item.location && (
                    <span className="bg-secondary text-secondary-foreground text-xs px-2.5 py-0.5 rounded-full font-medium">
                      📍 {item.location}
                    </span>
                  )}
                  {item.industry && (
                    <span className="bg-secondary text-secondary-foreground text-xs px-2.5 py-0.5 rounded-full font-medium">
                      🏢 {item.industry}
                    </span>
                  )}
                  {item.employee_count && (
                    <span className="bg-secondary text-secondary-foreground text-xs px-2.5 py-0.5 rounded-full font-medium">
                      👥 {item.employee_count}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4">No results found.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export { SearchComponent };
