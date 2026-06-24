import { Link } from "react-router-dom";

function RoomSetupCard({ setup }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={setup.image}
          alt={setup.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{setup.name}</h3>
        <p className="text-sm text-slate-600 mb-4">{setup.description}</p>
        <Link
          to={`/room-setup/${setup.id}`}
          className="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
        >
          View This Look
        </Link>
      </div>
    </div>
  );
}

export default RoomSetupCard;
