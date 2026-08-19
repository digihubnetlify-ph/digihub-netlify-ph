import { useReducer, useEffect, useMemo, useCallback } from "react";
import { cartReducer } from "../reducers";
import { CartContext, cartInitialState } from "./cartContextObject";

function loadCartFromStorage() {
    try {
        const saved = localStorage.getItem("dm_cart");
        return saved ? JSON.parse(saved) : cartInitialState;
    } catch {
        return cartInitialState;
    }
}

export const CartProvider = ({children}) => {
    const [state, dispatch] = useReducer(cartReducer, loadCartFromStorage());

    useEffect(() => {
        localStorage.setItem("dm_cart", JSON.stringify(state));
    }, [state]);

    // Total is ALWAYS recomputed from what's actually in cartList, never
    // tracked as its own incrementally-mutated number. A running total
    // (total + price on add, total - price on remove) can silently drift
    // from reality — leftover values from earlier sessions, a mismatched
    // add/remove, anything — and nothing would ever re-check it against the
    // real cart contents. Deriving it fresh here means it's mathematically
    // impossible for the displayed total to disagree with the actual items
    // shown, and it self-heals any stale value already sitting in
    // localStorage from before this fix, with no manual cache-clear needed.
    const total = useMemo(
        () => state.cartList.reduce((sum, item) => sum + item.price, 0),
        [state.cartList]
    );

    // Wrapped in useCallback with an empty dependency array so these keep
    // the exact same function reference across every render. Without this,
    // the context `value` object below (and every function inside it) gets
    // recreated on every CartProvider render, which forces every consumer
    // of useCart() to re-render too, and makes these functions unsafe to
    // list in another component's useEffect dependency array (they'd look
    // "different" every render, re-firing that effect constantly). This is
    // safe against stale closures because the actual list-manipulation
    // logic now lives in cartReducer, which always receives fresh state
    // from React on every dispatch — these functions never need to read
    // `state` themselves.
    const addToCart = useCallback((product) => {
        dispatch({ type: "ADD_TO_CART", payload: { product } })
    }, [])

    const removeFromCart = useCallback((product) => {
        dispatch({ type: "REMOVE_FROM_CART", payload: { product } })
    }, [])

    const clearCart = useCallback(() => {
        dispatch({ type: "CLEAR_CART", payload: {} })
    }, [])

    const value = useMemo(() => ({
        cartList: state.cartList,
        total,
        addToCart,
        removeFromCart,
        clearCart
    }), [state.cartList, total, addToCart, removeFromCart, clearCart])

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    )
}
