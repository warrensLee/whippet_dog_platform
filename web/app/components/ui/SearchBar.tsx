"use client";

import * as React from "react";
import Button from "./buttons/Button";

/*
    A simple search bar component that can be reused across the site.
*/

type SearchBarProps =
    {
        action: string;                 // The URL to submit the search form to
        query: string;                  // The current search query, used to populate the input field
        sort: string;                   // The current sort option, used to set the selected value of the sort dropdown
        placeholder?: string;           // Placeholder text for the search input field
        roundedLeft: boolean;
    }

export default function SearchBar({ action, query, sort, placeholder, roundedLeft }: SearchBarProps) {
    const [value, setValue] = React.useState(query);

    React.useEffect(() => {
        setValue(query);
    }, [query]);

    return (
        <form method="GET" action={action} className="flex flex-row items-center w-full">
            {/* 
                For simplicity, this search bar is implemented as a form 
                that submits a GET request to the specified action URL.

                The input field is pre-populated with the current query value, 
                and the sort option is included as a hidden input.                
            */}
            <input
                name="q"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                className={"w-full ml-0px border border-white/25 bg-white/95 px-6 py-3 text-[#12301D] text-base outline-none shadow-sm focus:ring-4 focus:ring-[#2E6B3F]/35 focus:border-[#2E6B3F]/60 " + (roundedLeft ? "rounded-l-full" : " ")}
            />
            {/* Invisible input to include the current sort option in the form submission.*/}
            <input type="hidden" name="sort" value={sort} />

            <Button type="submit" className="rounded-none !m-0 rounded-r-full !px-6 !py-3.25">
                Search
            </Button>
        </form>
    );
}