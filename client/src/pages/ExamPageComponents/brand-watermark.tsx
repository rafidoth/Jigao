import { Link } from "react-router";

function BrandWatermark() {
  return (
    <div className="fixed bottom-5 right-5 flex gap-2 justify-center items-center">
      <img src="/logo.png" className="size-8 rounded-md" />
      <Link to="/" className="text-sm font-bold">
        Jigao
      </Link>
    </div>
  );
}

export default BrandWatermark;
