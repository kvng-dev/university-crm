// frontend/src/pages/NotFoundPage.tsx
import { Link } from "react-router-dom";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100">
          <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
        </div>

        <h1 className="mt-6 text-6xl font-bold text-gray-900">404</h1>
        <h2 className="mt-2 text-3xl font-extrabold text-gray-900">
          Page not found
        </h2>

        <p className="mt-4 text-lg text-gray-600">
          Sorry, we couldn't find the page you're looking for.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Dashboard
          </Link>

          <Link
            to="/courses"
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Browse Courses
          </Link>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          If you believe this is an error, please{" "}
          <a
            href="mailto:support@university.edu"
            className="text-blue-600 hover:text-blue-500"
          >
            contact support
          </a>
        </p>
      </div>
    </div>
  );
};
