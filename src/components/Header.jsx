import { Link } from 'react-router-dom';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-white text-xl font-bold">
          Home
        </Link>
        {/* Tu peux ajouter d'autres liens ici si nécessaire */}
      </div>
    </nav>
  );
};

export default Navbar;