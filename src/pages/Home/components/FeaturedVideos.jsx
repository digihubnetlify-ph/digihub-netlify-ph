import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ProductCard } from "../../../components";
import { FeaturedRowSkeleton } from "../../../components/Elements/Skeleton";
import { getFeaturedVideoList } from "../../../services";

export const FeaturedVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVideos() {
      try {
        const data = await getFeaturedVideoList();
        setVideos(data);
      } catch (error) {
        toast.error(error.message, { closeButton: true, position: "bottom-center" });
      } finally {
        setLoading(false);
      }
    }
    fetchVideos();
  }, []);

  if (loading) return <FeaturedRowSkeleton />;
  if (videos.length === 0) return null;

  return (
    <section className="my-10">
      <h1 className="text-2xl text-center font-semibold dark:text-slate-100 mb-5 underline underline-offset-8">
        Featured Videos
      </h1>
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4 px-4">
        {videos.map((video) => (
          <ProductCard key={video.id} product={video} compact />
        ))}
      </div>
    </section>
  );
};
