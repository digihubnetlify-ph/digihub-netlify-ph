export const cartReducer = (state, action) => {
    const { type, payload } = action;

    switch(type){

        // The reducer computes the new cartList itself from its own `state`
        // parameter (always the current, up-to-date state — React guarantees
        // this on every dispatch), instead of receiving an already-computed
        // full replacement list from the component. That lets addToCart /
        // removeFromCart in CartContext be wrapped in useCallback with an
        // empty dependency array and never go stale, since they no longer
        // need to read `state.cartList` from their own closure.
        case "ADD_TO_CART": {
            // Each entry in the cart gets its own cartItemId, separate from
            // the product's id. Two of the same product added to the cart
            // share a product.id but get different cartItemIds, so they can
            // be told apart later — otherwise removing one removes every
            // item that shares that product.id, which is the "remove
            // deletes both" bug.
            const cartItemId =
                (typeof crypto !== "undefined" && crypto.randomUUID)
                    ? crypto.randomUUID()
                    : `${payload.product.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            return { ...state, cartList: state.cartList.concat({ ...payload.product, cartItemId }) }
        }

        case "REMOVE_FROM_CART": {
            // Remove only the exact cart entry that was clicked, identified
            // by its unique cartItemId, not every item that shares the same
            // product.id.
            const { product } = payload;
            const cartList = product.cartItemId
                ? state.cartList.filter(item => item.cartItemId !== product.cartItemId)
                : state.cartList.filter(item => item.id !== product.id); // fallback for legacy cart data without cartItemId
            return { ...state, cartList }
        }

        case "CLEAR_CART":
            return { ...state, cartList: [] }

        default:
            throw new Error("No case found!");
    }
}