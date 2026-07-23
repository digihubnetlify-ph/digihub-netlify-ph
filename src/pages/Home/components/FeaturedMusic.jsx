import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ProductCard } from "../../../components";
import { FeaturedRowSkeleton } from "../../../components/Elements/Skeleton";
import { getFeaturedMusicList } from "../../../services";

export const FeaturedMusic = () => {
  const [music, setMusic] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMusic() {
      try {
        const data = await getFeaturedMusicList();
        setMusic(data);
      } catch (error) {
        toast.error(error.message, { closeButton: true, position: "bottom-center" });
      } finally {
        setLoading(false);
      }
    }
    fetchMusic();
  }, []);

  if (loading) return <FeaturedRowSkeleton />;
  if (music.length === 0) return null;

  return (
    <section className="my-10">
      <h1 className="text-2xl text-center font-semibold dark:text-slate-100 mb-5 underline underline-offset-8">
        Featured Music
      </h1>
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4 px-4">
        {music.map((album) => (
          <ProductCard key={album.id} product={album} compact />
        ))}
      </div>
    </section>
  );
};
