import { useEffect, useState } from "react";
import { getOwnedStreamUrlsMap } from "../services";
import { supabase } from "../services/supabaseClient";
import { OwnershipContext } from "./ownershipContextObject";

// Fetched once per page load AND refetched whenever auth state changes,
// since login/logout here is client-side SPA navigation, not a full page
// reload — without this, "Watch Online" for previously-bought items
// wouldn't appear until the visitor manually refreshed after logging in.
// Shared via context so a grid of a dozen ProductCards doesn't each fire
// their own ownership query.

export const OwnershipProvider = ({ children }) => {
  const [ownedMap, setOwnedMap] = useState({});

  useEffect(() => {
    function refresh() {
      // Silent by design: logged-out visitors just get an empty map, no
      // toast — this shouldn't interrupt browsing.
      getOwnedStreamUrlsMap()
        .then(setOwnedMap)
        .catch(() => setOwnedMap({}));
    }

    refresh();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(refresh);
    return () => subscription.unsubscribe();
  }, []);

  return (
    <OwnershipContext.Provider value={ownedMap}>
      {children}
    </OwnershipContext.Provider>
  );
};
