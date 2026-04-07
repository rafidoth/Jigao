import { Link } from "react-router";

function BrandWatermark() {
    return (
        <div className="fixed bottom-5 right-5 flex gap-2 justify-center items-center z-50">
            <Link to="/" className="text-sm font-bold hover:underline">
                Jigao
            </Link>
        </div>
    );
}

export default BrandWatermark;
