import { createContext } from "react";

export const filterInitialState = {
    productList: [],
    onlyInStock: false,
    bestSellerOnly: false,
    sortBy: null,
    ratings: null
}

export const FilterContext = createContext(filterInitialState);
