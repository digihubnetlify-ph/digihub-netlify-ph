import { useContext } from "react";
import { FilterContext } from "./filterContextObject";

export const useFilter = () => {
    const context = useContext(FilterContext);
    return context;
}
