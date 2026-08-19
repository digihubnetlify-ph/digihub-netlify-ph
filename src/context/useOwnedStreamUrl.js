import { useContext } from "react";
import { OwnershipContext } from "./ownershipContextObject";

// Returns the confirmed stream URL for a product, or null if the current
// visitor hasn't paid for it (or isn't logged in).
export const useOwnedStreamUrl = (productId) => {
  const ownedMap = useContext(OwnershipContext);
  return ownedMap[productId] || null;
};
