import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const PublicProfile = () => {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Account Profile
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Your account details and subscription status.
              </p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user?.name}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user?.email}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Subscription Status
                  </dt>
                  <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                    {user?.subscriptionTier ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {user.subscriptionTier} plan
                      </span>
                    ) : (
                      <div className="space-y-2">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          No active subscription
                        </span>
                        <div>
                          <Link
                            to="/pricing"
                            className="text-primary hover:text-primary-dark text-sm font-medium"
                          >
                            View pricing plans →
                          </Link>
                        </div>
                      </div>
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            {!user?.subscriptionTier && (
              <div className="px-4 py-5 bg-gray-50 space-y-6 sm:px-6">
                <div className="rounded-md bg-blue-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Complete your registration
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>
                          To access AutoLawn features, please select a subscription plan.
                        </p>
                      </div>
                      <div className="mt-4">
                        <Link
                          to="/pricing"
                          className="text-sm font-medium text-blue-800 hover:text-blue-600"
                        >
                          View pricing <span aria-hidden="true">&rarr;</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PublicProfile;
