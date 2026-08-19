import { createContext } from "react";

export const cartInitialState = {
    cartList: [],
    total: 0
}

export const CartContext = createContext(cartInitialState);
