import { useLocation, useNavigate } from "react-router-dom";
import { useTitle } from "../../hooks/useTitle";
import { OrderSuccess } from "./components/OrderSuccess";
import { OrderFail } from "./components/OrderFail";

export const OrderPage = () => {
  useTitle("Order Summary");
  const { state } = useLocation();
  const navigate = useNavigate();

  // If no state, PayMongo redirected here after payment
  if (!state) {
    return (
      <main>
        <OrderSuccess data={null} />
      </main>
    );
  }

  return (
    <main>
      { state.status ? <OrderSuccess data={state.data} /> : <OrderFail /> }
    </main>
  );
}