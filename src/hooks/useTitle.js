import { useEffect } from "react";

export const useTitle = (title) => {

    useEffect(() => {
        document.title = `${title} -Download Play, and Watch`;
    }, [title]);

  return null;
}