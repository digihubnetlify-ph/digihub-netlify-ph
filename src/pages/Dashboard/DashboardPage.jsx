import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useTitle } from "../../hooks/useTitle";
import { getUserOrders } from "../../services";
import { DashboardCard } from "./components/DashboardCard";
import { DashboardEmpty } from "./components/DashboardEmpty";
import { DashboardSkeleton } from "../../components/Elements/Skeleton";

export const DashboardPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  useTitle("Dashboard");

  useEffect(() => {
    async function fetchOrders() {
      try {
        const data = await getUserOrders();
        // Cancelled orders stay in the DB for record-keeping, but there's
        // nothing actionable left for the user to do with one — hide them
        // from view here rather than showing a stale/confusing badge.
        setOrders(data.filter((order) => order.status !== "cancelled"));
      } catch (error) {
        toast.error(error.message, { closeButton: true, position: "bottom-center" });
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  if (loading) return <DashboardSkeleton />;

  return (
    <main>
      <section>
        <p className="text-2xl text-center font-semibold dark:text-slate-100 my-10 underline underline-offset-8">My Dashboard</p>
      </section>

      <section>
        {orders.length > 0 && orders.map((order) => (
          <DashboardCard
            key={order.id}
            order={order}
            onCancelled={(cancelledId) =>
              setOrders((prev) => prev.filter((o) => o.id !== cancelledId))
            }
          />
        ))}
      </section>

      <section>
        {!orders.length && <DashboardEmpty />}
      </section>
    </main>
  );
};
