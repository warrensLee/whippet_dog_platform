// @/lib/search/type.ts
// What will be a result from a search? What does a user search for?
// This will be where we define parameters that will be used in searching and filtering!
// For filtering lets use sex, year, active, and title 

                            

export type DogSearchRequest =
{ 
  q: string;
  page?: number;      // will default to 1 
  limit?: number;     // will default to 20
  sort?: "relevance" | "name_asc" | "name_desc" | "newest";
  year?: number;
  active?: "Y" | "N";
};



export type DogSearchResult = 
{
  id: string;
  name: string;
  regNo?: string;
  year?: number;
  ownerName?: string;
  title?: string;
  active?: "Y" | "N";
};



export type DogSearchResponse = 
{
  params: 
  {
    q: string;
    page: number;      // will default to 1 
    limit: number;     // will default to 20
    sort: "relevance" | "name_asc" | "name_desc" | "newest";
    year?: number;
    active?: "Y" | "N";
  };

  total: number;
  items: DogSearchResult[];
};