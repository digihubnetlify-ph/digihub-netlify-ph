import { createContext } from "react";

// { [productId]: streamUrl } for whatever the current visitor has actually
// PAID for. See OwnershipContext.jsx for the provider that populates this.
export const OwnershipContext = createContext({});
